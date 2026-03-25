// src/lib/audioController.js
// One shared audio player + tiny pub/sub store (mobile + desktop both use this)

let _tracks = [];
let _index = 0;

const audio = new Audio();
audio.preload = "metadata";
audio.playsInline = true;

const IS_IOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/i.test(navigator.userAgent);

let _preferBackgroundOnIOS = true;

let audioCtx = null;
let mediaNode = null;
let gainNode = null;
let _webAudioReady = false;

let _volume = 0.55;

try {
  audio.volume = _volume;
} catch {}

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
  if (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  ) {
    return src;
  }
  return `/audio/${src}`;
}

/* =========================
   Media Session
   ========================= */
let _mediaSessionInited = false;

function safeSetAction(action, handler) {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {}
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
  } catch {}
}

/* =========================
   Emit
   ========================= */
function emit(opts) {
  _state = {
    ..._state,
    tracks: _tracks,
    index: _index,
    volume: _volume,
  };

  listeners.forEach((fn) => fn(_state));
  updateMediaSession(opts);
}

/* =========================
   WebAudio helpers
   ========================= */
function shouldUseWebAudio() {
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

    if (!mediaNode) mediaNode = audioCtx.createMediaElementSource(audio);
    if (!gainNode) gainNode = audioCtx.createGain();

    gainNode.gain.value = _volume;

    mediaNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

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

function setTrack(index, opts = {}) {
  setTrackIndex(index, opts);
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
  setTrack,
  unlock: unlockAudioContext,
  setPreferBackgroundOnIOS: (v) => {
    _preferBackgroundOnIOS = !!v;
    emit();
  },
};