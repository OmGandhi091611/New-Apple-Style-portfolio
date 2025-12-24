// src/lib/audioController.js
// One shared audio player + tiny pub/sub store (mobile + desktop both use this)

let _tracks = [];
let _index = 0;

const audio = new Audio();
audio.preload = "metadata";
audio.playsInline = true;

// ---- WebAudio (for real volume control on iOS) ----
let audioCtx = null;
let mediaNode = null;
let gainNode = null;
let _webAudioReady = false;

let _volume = 0.55;

// IMPORTANT:
// - On many browsers audio.volume works.
// - On iOS Safari, audio.volume is constrained/ignored.
// We’ll still set it, but the GainNode is the real control when available.
try {
  audio.volume = _volume;
} catch {}

// ---- Shared state ----
let _state = {
  tracks: _tracks,
  index: _index,
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: _volume,
  error: "",
};

const listeners = new Set();

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeSrc(src) {
  if (!src) return "";
  // Accept absolute (/audio/x.mp3) or URL, otherwise assume it lives in /public/audio/
  if (src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://")) return src;
  return `/audio/${src}`;
}

function emit() {
  _state = { ..._state, tracks: _tracks, index: _index, volume: _volume };
  listeners.forEach((fn) => fn(_state));
}

/**
 * Create WebAudio graph once:
 * audio (media element) -> MediaElementSource -> GainNode -> destination
 *
 * NOTE: createMediaElementSource() can only be called once per <audio>.
 */
function ensureWebAudioGraph() {
  if (_webAudioReady) return;

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    audioCtx = audioCtx || new Ctx();

    // Create nodes once
    if (!mediaNode) mediaNode = audioCtx.createMediaElementSource(audio);
    if (!gainNode) gainNode = audioCtx.createGain();

    // Set initial gain to our volume
    gainNode.gain.value = _volume;

    // Connect graph only once
    mediaNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // When using gain node, keep element volume at 1 to avoid double scaling (where possible).
    try {
      audio.volume = 1;
    } catch {}

    _webAudioReady = true;
  } catch (e) {
    // If anything fails, we simply fall back to audio.volume.
    console.warn("WebAudio volume not available, falling back:", e);
    _webAudioReady = false;
  }
}

/**
 * iOS requires user gesture to start/resume AudioContext.
 * Call this inside any user-initiated action: play/pause, next, prev, volume drag, etc.
 */
function unlockAudioContext() {
  ensureWebAudioGraph();
  if (!audioCtx) return;

  if (audioCtx.state !== "running") {
    audioCtx.resume().catch(() => {});
  }
}

function safePlay() {
  unlockAudioContext();

  const p = audio.play();
  if (p && typeof p.catch === "function") {
    p.catch((err) => {
      // iOS: might block until user gesture; don't spam console
      if (err?.name === "NotAllowedError") return;
      if (err?.name === "AbortError") return;
      console.error("Audio play failed:", err);
    });
  }
}

function setTrackIndex(nextIndex, { autoplay = true } = {}) {
  if (!_tracks.length) return;

  const next = ((nextIndex % _tracks.length) + _tracks.length) % _tracks.length;
  _index = next;

  const src = normalizeSrc(_tracks[_index]?.src);
  if (!src) return;

  _state.error = "";
  _state.currentTime = 0;
  _state.duration = 0;
  emit();

  audio.pause();
  audio.currentTime = 0;
  audio.src = src;

  // IMPORTANT for mobile Safari: force metadata fetch
  try {
    audio.load();
  } catch {
    // ignore
  }

  if (autoplay) safePlay();
  emit();
}

function initTracks(tracks) {
  const arr = Array.isArray(tracks) ? tracks : [];
  _tracks = arr;
  _state.tracks = _tracks;

  // keep index valid
  _index = clamp(_index, 0, Math.max(0, _tracks.length - 1));
  _state.index = _index;

  // If no src loaded yet, load current track (no autoplay)
  if (_tracks.length && !audio.src) {
    setTrackIndex(_index, { autoplay: false });
  } else {
    emit();
  }
}

function togglePlay() {
  if (!_tracks.length) return;

  // If src missing, load current track
  if (!audio.src) {
    setTrackIndex(_index, { autoplay: true });
    return;
  }

  if (!audio.paused) audio.pause();
  else safePlay();
}

function next() {
  if (!_tracks.length) return;
  setTrackIndex(_index + 1, { autoplay: true });
}

function prev() {
  if (!_tracks.length) return;
  setTrackIndex(_index - 1, { autoplay: true });
}

function seekTo(t) {
  const d = Number.isFinite(audio.duration) ? audio.duration : _state.duration;
  const nextT = clamp(t, 0, d || 0);
  audio.currentTime = nextT;
  _state.currentTime = nextT;
  emit();
}

function setVolume(v) {
  _volume = clamp(v, 0, 1);

  // Make sure context is unlocked if user is dragging volume on iOS
  unlockAudioContext();

  // Prefer GainNode when available
  if (_webAudioReady && gainNode && audioCtx) {
    try {
      // Smooth a bit to avoid clicks
      gainNode.gain.setTargetAtTime(_volume, audioCtx.currentTime, 0.01);
    } catch {
      gainNode.gain.value = _volume;
    }
  } else {
    // Fallback (works on desktop, often ignored on iOS)
    try {
      audio.volume = _volume;
    } catch {}
  }

  _state.volume = _volume;
  emit();
}

// ---- Events ----
audio.addEventListener("timeupdate", () => {
  _state.currentTime = audio.currentTime || 0;
  emit();
});

function updateMeta() {
  const d = Number.isFinite(audio.duration) ? audio.duration : 0;
  _state.duration = d;
  emit();

  // iOS edge-case: duration Infinity until enough buffered
  if (audio.duration === Infinity) {
    try {
      const old = audio.currentTime;
      audio.currentTime = 1e101;
      const onFix = () => {
        audio.currentTime = old;
        audio.removeEventListener("durationchange", onFix);
      };
      audio.addEventListener("durationchange", onFix);
    } catch {
      // ignore
    }
  }
}

audio.addEventListener("loadedmetadata", updateMeta);
audio.addEventListener("durationchange", updateMeta);

audio.addEventListener("play", () => {
  _state.playing = true;
  emit();
});

audio.addEventListener("pause", () => {
  _state.playing = false;
  emit();
});

audio.addEventListener("ended", () => {
  next();
});

audio.addEventListener("error", () => {
  const code = audio?.error?.code;
  _state.error = `Audio not supported / not found${code ? ` (code ${code})` : ""}`;
  _state.playing = false;
  emit();
});

// iOS-friendly ticker (sometimes timeupdate is sparse)
setInterval(() => {
  if (!audio.paused) {
    _state.currentTime = audio.currentTime || 0;
    if (Number.isFinite(audio.duration)) _state.duration = audio.duration || 0;
    emit();
  }
}, 200);

// ---- Public API ----
export function subscribeAudio(fn) {
  listeners.add(fn);
  fn(_state);
  return () => listeners.delete(fn);
}

export function getAudioState() {
  return _state;
}

export const audioActions = {
  initTracks,
  togglePlay,
  next,
  prev,
  seekTo,
  setVolume,
  setTrackIndex,

  // Optional: if you want to call it explicitly on any first tap
  unlock: unlockAudioContext,
};
