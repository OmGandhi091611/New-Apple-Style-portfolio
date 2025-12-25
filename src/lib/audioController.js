// src/lib/audioController.js
// One shared audio player + tiny pub/sub store (mobile + desktop both use this)
//
// Goals:
// - Background/lock-screen playback reliability on iOS Brave/WebKit
// - Volume control on non-iOS via audio.volume or WebAudio GainNode
//
// Key tradeoff:
// - iOS background playback is more reliable with plain <audio> (no AudioContext).
// - WebAudio (GainNode) enables in-app volume on iOS, but can stop on screen lock.
//
// Default behavior here:
// - iOS: prefer background reliability => NO WebAudio (device volume controls loudness)
// - non-iOS: use WebAudio GainNode available (smooth volume)

let _tracks = [];
let _index = 0;

const audio = new Audio();
audio.preload = "metadata";
audio.playsInline = true;

// ---- Platform detection ----
const IS_IOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/i.test(navigator.userAgent);

// Prefer background reliability on iOS (disable WebAudio by default)
let _preferBackgroundOnIOS = true;

// ---- WebAudio (optional) ----
let audioCtx = null;
let mediaNode = null;
let gainNode = null;
let _webAudioReady = false;

// Volume state
let _volume = 0.55;

try {
  audio.volume = _volume;
} catch {}

// ---- Store ----
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
  if (src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://")) return src;
  return `/audio/${src}`;
}

/* =========================
   Media Session (lock screen / background friendliness)
   ========================= */
let _mediaSessionInited = false;

function safeSetAction(action, handler) {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // ignore unsupported actions
  }
}

function updateMediaSession({ forceMetadata = false } = {}) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

  const track = _tracks?.[_index];
  if (!track) return;

  try {
    if (!_mediaSessionInited) {
      _mediaSessionInited = true;

      safeSetAction("play", () => {
        if (audio.paused) togglePlay();
      });
      safeSetAction("pause", () => {
        if (!audio.paused) togglePlay();
      });
      safeSetAction("previoustrack", () => prev());
      safeSetAction("nexttrack", () => next());
    }

    if (forceMetadata || !navigator.mediaSession.metadata) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || "Music",
        artist: track.artist || "Portfolio",
        album: track.album || "Om Gandhi",
        // artwork optional:
        // artwork: [{ src: track.artwork || "/cover.png", sizes: "512x512", type: "image/png" }],
      });
    }

    navigator.mediaSession.playbackState = _state.playing ? "playing" : "paused";

    const d = Number.isFinite(_state.duration) ? _state.duration : 0;
    const t = Number.isFinite(_state.currentTime) ? _state.currentTime : 0;
    if (navigator.mediaSession.setPositionState && d > 0) {
      navigator.mediaSession.setPositionState({
        duration: d,
        position: clamp(t, 0, d),
        playbackRate: 1,
      });
    }
  } catch {
    // ignore
  }
}

/* =========================
   Emit
   ========================= */
function emit(opts) {
  _state = { ..._state, tracks: _tracks, index: _index, volume: _volume };
  listeners.forEach((fn) => fn(_state));
  updateMediaSession(opts);
}

/* =========================
   WebAudio helpers
   ========================= */
function shouldUseWebAudio() {
  // iOS: prefer background reliability => return false (no AudioContext)
  if (IS_IOS && _preferBackgroundOnIOS) return false;
  return true;
}

function ensureWebAudioGraph() {
  if (!shouldUseWebAudio()) return;
  if (_webAudioReady) return;

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    audioCtx = audioCtx || new Ctx();

    // createMediaElementSource can only be called ONCE per audio element
    if (!mediaNode) mediaNode = audioCtx.createMediaElementSource(audio);
    if (!gainNode) gainNode = audioCtx.createGain();

    gainNode.gain.value = _volume;

    mediaNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Avoid double scaling
    try {
      audio.volume = 1;
    } catch {}

    _webAudioReady = true;
  } catch (e) {
    console.warn("WebAudio unavailable; falling back:", e);
    _webAudioReady = false;
  }
}

function unlockAudioContext() {
  if (!shouldUseWebAudio()) return;
  ensureWebAudioGraph();
  if (!audioCtx) return;

  if (audioCtx.state !== "running") {
    audioCtx.resume().catch(() => {});
  }
}

function safePlay() {
  // Only unlock WebAudio if we actually use it
  unlockAudioContext();

  const p = audio.play();
  if (p && typeof p.catch === "function") {
    p.catch((err) => {
      if (err?.name === "NotAllowedError") return;
      if (err?.name === "AbortError") return;
      console.error("Audio play failed:", err);
    });
  }
}

/* =========================
   Player actions
   ========================= */
function setTrackIndex(nextIndex, { autoplay = true } = {}) {
  if (!_tracks.length) return;

  const next = ((nextIndex % _tracks.length) + _tracks.length) % _tracks.length;
  _index = next;

  const src = normalizeSrc(_tracks[_index]?.src);
  if (!src) return;

  _state.error = "";
  _state.currentTime = 0;
  _state.duration = 0;

  emit({ forceMetadata: true });

  audio.pause();
  audio.currentTime = 0;
  audio.src = src;

  try {
    audio.load();
  } catch {}

  if (autoplay) safePlay();
  emit({ forceMetadata: true });
}

function initTracks(tracks) {
  const arr = Array.isArray(tracks) ? tracks : [];
  _tracks = arr;
  _state.tracks = _tracks;

  _index = clamp(_index, 0, Math.max(0, _tracks.length - 1));
  _state.index = _index;

  if (_tracks.length && !audio.src) {
    setTrackIndex(_index, { autoplay: false });
  } else {
    emit({ forceMetadata: true });
  }
}

function togglePlay() {
  if (!_tracks.length) return;

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

  // If using WebAudio, control gain. Otherwise, try element volume.
  if (shouldUseWebAudio()) {
    unlockAudioContext();
    if (_webAudioReady && gainNode && audioCtx) {
      try {
        gainNode.gain.setTargetAtTime(_volume, audioCtx.currentTime, 0.01);
      } catch {
        gainNode.gain.value = _volume;
      }
    } else {
      try {
        audio.volume = _volume;
      } catch {}
    }
  } else {
    // iOS background mode: device volume is the real control.
    // audio.volume may be ignored; still set it for non-iOS WebKit edge cases.
    try {
      audio.volume = _volume;
    } catch {}
  }

  _state.volume = _volume;
  emit();
}

/* =========================
   Events
   ========================= */
audio.addEventListener("timeupdate", () => {
  _state.currentTime = audio.currentTime || 0;
  emit();
});

function updateMeta() {
  const d = Number.isFinite(audio.duration) ? audio.duration : 0;
  _state.duration = d;
  emit();

  if (audio.duration === Infinity) {
    try {
      const old = audio.currentTime;
      audio.currentTime = 1e101;
      const onFix = () => {
        audio.currentTime = old;
        audio.removeEventListener("durationchange", onFix);
      };
      audio.addEventListener("durationchange", onFix);
    } catch {}
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

/* =========================
   Public API
   ========================= */
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

  // Unlock WebAudio for non-iOS (or if you later disable iOS background preference)
  unlock: unlockAudioContext,

  // OPTIONAL: let you flip the tradeoff at runtime:
  // true  => iOS prefers background reliability (no WebAudio)
  // false => iOS uses WebAudio for in-app volume (may stop on lock)
  setPreferBackgroundOnIOS: (v) => {
    _preferBackgroundOnIOS = !!v;
    // If switching to WebAudio mode, build graph on next gesture
    emit();
  },
};
