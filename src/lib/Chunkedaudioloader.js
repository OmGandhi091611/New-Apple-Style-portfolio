// src/lib/chunkedAudioLoader.js
// Streams audio in chunks using HTTP Range requests + Media Source Extensions (MSE)
// Falls back gracefully to native <audio> src if MSE isn't supported

const CHUNK_SIZE = 256 * 1024;       // 256 KB per chunk
const BUFFER_AHEAD_SECS = 30;        // keep 30 s of audio buffered ahead
const MIME_TYPE = "audio/mpeg";      // for MP3; swap to 'audio/mp4' for AAC/M4A

// MPEG1 Layer3 bitrate table (kbps), index 0 = free, 15 = bad
const MP3_BITRATES = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0];

function estimateMp3Duration(buffer, totalBytes) {
  const view = new DataView(buffer);
  let offset = 0;

  // Skip ID3v2 tag if present ("ID3")
  if (
    view.byteLength > 10 &&
    view.getUint8(0) === 0x49 &&
    view.getUint8(1) === 0x44 &&
    view.getUint8(2) === 0x33
  ) {
    const id3Len =
      ((view.getUint8(6) & 0x7f) << 21) |
      ((view.getUint8(7) & 0x7f) << 14) |
      ((view.getUint8(8) & 0x7f) << 7) |
       (view.getUint8(9) & 0x7f);
    offset = 10 + id3Len;
  }

  // Walk forward looking for an MP3 sync frame
  while (offset < view.byteLength - 4) {
    if (
      view.getUint8(offset) === 0xff &&
      (view.getUint8(offset + 1) & 0xe0) === 0xe0
    ) {
      const bitrateIdx = (view.getUint8(offset + 2) >> 4) & 0x0f;
      const kbps = MP3_BITRATES[bitrateIdx];
      if (kbps > 0) {
        return totalBytes / ((kbps * 1000) / 8); // seconds
      }
    }
    offset++;
  }
  return 0;
}

function isMSESupported() {
  return (
    typeof window !== "undefined" &&
    window.MediaSource &&
    MediaSource.isTypeSupported(MIME_TYPE)
  );
}

export class ChunkedAudioLoader {
  constructor(audioEl) {
    this._audio = audioEl;
    this._reset();
  }

  /* ─── Public API ──────────────────────────────────────────────────── */

  /**
   * Start loading a new URL in chunks.
   * Call this instead of setting audio.src directly.
   */
  async load(url) {
    this._teardown();

    if (!isMSESupported()) {
      // Graceful fallback — native browser range requests still work, just
      // the browser decides how much to buffer.
      this._audio.src = url;
      return;
    }

    this._url = url;

    // 1. HEAD request to get total file size (needed to know byte ranges)
    try {
      const head = await fetch(url, { method: "HEAD" });
      this._totalSize = parseInt(head.headers.get("content-length") ?? "0", 10);

      if (!this._totalSize) {
        // Server didn't send Content-Length — fall back gracefully
        this._audio.src = url;
        return;
      }
    } catch {
      this._audio.src = url;
      return;
    }

    // 2. Create a MediaSource and wire it to the <audio> element
    this._ms = new MediaSource();
    const objectURL = URL.createObjectURL(this._ms);
    this._objectURL = objectURL;
    this._audio.src = objectURL;

    this._ms.addEventListener("sourceopen", () => this._onSourceOpen(), {
      once: true,
    });
  }

  /**
   * Call on seek so we fetch the right byte range immediately.
   */
  onSeek(currentTime) {
    if (!this._sb || !this._totalSize) return;

    // Rough byte offset estimate from time position
    const duration = this._audio.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const estimatedByte = Math.floor(
      (currentTime / duration) * this._totalSize
    );

    // Only fetch if that region isn't already buffered
    if (!this._isByteBuffered(estimatedByte)) {
      this._fetchedUpTo = estimatedByte;
      this._scheduleChunk();
    }
  }

  /**
   * Abort all in-flight requests and clean up MSE objects.
   * Call this before loading a new track or unmounting.
   */
  destroy() {
    this._teardown();
  }

  /* ─── Private ─────────────────────────────────────────────────────── */

  _reset() {
    this._url = null;
    this._ms = null;
    this._sb = null;
    this._objectURL = null;
    this._totalSize = 0;
    this._fetchedUpTo = 0;
    this._queue = [];          // ArrayBuffer chunks waiting to be appended
    this._appending = false;
    this._allFetched = false;
    this._abortCtrl = null;
    this._chunkTimer = null;
  }

  _teardown() {
    // Cancel in-flight fetch
    this._abortCtrl?.abort();
    clearTimeout(this._chunkTimer);

    // Release object URL
    if (this._objectURL) {
      URL.revokeObjectURL(this._objectURL);
    }

    // Close MediaSource cleanly
    try {
      if (this._ms?.readyState === "open") this._ms.endOfStream();
    } catch {}

    this._reset();
  }

  _onSourceOpen() {
    try {
      this._sb = this._ms.addSourceBuffer(MIME_TYPE);
      this._sb.mode = "sequence"; // ensures chunks are played in order

      this._sb.addEventListener("updateend", () => this._onUpdateEnd());

      // Start fetching the very first chunk immediately
      this._scheduleChunk();
    } catch (e) {
      console.warn("[ChunkedAudioLoader] SourceBuffer creation failed:", e);
      // Fall back: revoke MSE object URL and set a plain src
      URL.revokeObjectURL(this._objectURL);
      this._audio.src = this._url;
    }
  }

  _scheduleChunk() {
    // Debounce rapid successive calls (e.g., quick seek + timeupdate)
    clearTimeout(this._chunkTimer);
    this._chunkTimer = setTimeout(() => this._maybeFetchChunk(), 0);
  }

  _maybeFetchChunk() {
    if (this._allFetched) return;
    if (this._abortCtrl) return; // already fetching

    // How much audio do we have buffered ahead of playhead?
    const bufferedAhead = this._bufferedAhead();
    if (bufferedAhead >= BUFFER_AHEAD_SECS) {
      // Enough buffered — check again when we're getting close
      const waitMs = Math.max(5000, (bufferedAhead - BUFFER_AHEAD_SECS * 0.5) * 1000);
      this._chunkTimer = setTimeout(() => this._maybeFetchChunk(), waitMs);
      return;
    }

    this._fetchChunk(this._fetchedUpTo);
  }

  async _fetchChunk(start) {
    if (start >= this._totalSize) {
      this._allFetched = true;
      this._tryEndStream();
      return;
    }

    const end = Math.min(start + CHUNK_SIZE - 1, this._totalSize - 1);

    this._abortCtrl = new AbortController();

    try {
      const res = await fetch(this._url, {
        headers: { Range: `bytes=${start}-${end}` },
        signal: this._abortCtrl.signal,
      });

      if (!res.ok && res.status !== 206) {
        throw new Error(`Unexpected status ${res.status}`);
      }

      const buf = await res.arrayBuffer();
      this._abortCtrl = null;
      this._fetchedUpTo = end + 1;

      // On the very first chunk, estimate total duration and set it on the
      // MediaSource so audio.duration is correct from the start (not Infinity).
      if (start === 0 && this._ms?.readyState === "open" && this._totalSize) {
        const est = estimateMp3Duration(buf, this._totalSize);
        if (est > 0) {
          try { this._ms.duration = est; } catch {}
        }
      }

      // Queue the chunk to be appended to the SourceBuffer
      this._queue.push(buf);
      this._processQueue();
    } catch (e) {
      this._abortCtrl = null;
      if (e?.name !== "AbortError") {
        console.warn("[ChunkedAudioLoader] Fetch error:", e);
      }
    }
  }

  _processQueue() {
    if (this._appending) return;
    if (!this._queue.length) return;
    if (!this._sb || this._sb.updating) return;

    this._appending = true;
    const chunk = this._queue.shift();
    try {
      this._sb.appendBuffer(chunk);
    } catch (e) {
      this._appending = false;
      console.warn("[ChunkedAudioLoader] appendBuffer error:", e);
    }
  }

  _onUpdateEnd() {
    this._appending = false;

    // Drain any queued chunks first
    if (this._queue.length) {
      this._processQueue();
      return;
    }

    // Try to end stream if everything is fetched
    if (this._allFetched) {
      this._tryEndStream();
      return;
    }

    // Otherwise schedule the next chunk fetch
    this._scheduleChunk();
  }

  _tryEndStream() {
    try {
      if (this._ms?.readyState === "open" && !this._sb?.updating) {
        this._ms.endOfStream();
      }
    } catch {}
  }

  /** Seconds of audio buffered ahead of the current playhead */
  _bufferedAhead() {
    try {
      const buf = this._sb?.buffered;
      if (!buf?.length) return 0;
      const t = this._audio.currentTime;
      for (let i = 0; i < buf.length; i++) {
        if (buf.start(i) <= t && t <= buf.end(i)) {
          return buf.end(i) - t;
        }
      }
    } catch {}
    return 0;
  }

  /** Check whether a given byte offset is inside an already-buffered time range */
  _isByteBuffered(byte) {
    if (!this._totalSize || !this._audio.duration) return false;
    const estTime = (byte / this._totalSize) * this._audio.duration;
    try {
      const buf = this._sb?.buffered;
      if (!buf?.length) return false;
      for (let i = 0; i < buf.length; i++) {
        if (buf.start(i) <= estTime && estTime <= buf.end(i)) return true;
      }
    } catch {}
    return false;
  }
}