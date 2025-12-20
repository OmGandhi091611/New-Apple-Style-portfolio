// src/components/ControlCenter.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, animate, useDragControls, useMotionValue } from "framer-motion";
import {
  Airplay,
  Wifi,
  Bluetooth,
  Plane,
  Moon,
  Focus,
  Flashlight,
  Camera,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Sun,
} from "lucide-react";
import { MUSIC_TRACKS } from "#constants";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function normalizeSrc(src) {
  if (!src) return "";
  // Important for iOS when filenames contain spaces, commas, etc.
  // encodeURI keeps slashes but encodes spaces and punctuation safely.
  return encodeURI(src);
}

function safePlay(a) {
  if (!a) return;
  const p = a.play();
  if (p && typeof p.catch === "function") {
    p.catch((err) => {
      if (err?.name === "AbortError") return;
      // NotAllowedError happens if user didn't tap yet; ignore quietly
      if (err?.name === "NotAllowedError") return;
      console.error("Audio play failed:", err);
    });
  }
}

export default function ControlCenter({
  open,
  onClose,
  closedY = -560,
  openY = 0,
  yExternal,
  initialBrightness = 0.85,
  initialVolume = 0.55,
}) {
  const y = yExternal ?? useMotionValue(closedY);
  const dragControls = useDragControls();

  const tracks = Array.isArray(MUSIC_TRACKS) ? MUSIC_TRACKS : [];

  const [brightness, setBrightness] = useState(initialBrightness);
  const [volume, setVolume] = useState(initialVolume);

  const [toggles, setToggles] = useState({
    wifi: true,
    bluetooth: true,
    airplane: false,
    dnd: false,
  });

  // Audio state
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState("");

  const audioRef = useRef(null);
  const seekingRef = useRef(false);

  // mount/unmount for animation
  const [rendered, setRendered] = useState(open);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setRendered(true);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    } else if (rendered) {
      closeTimerRef.current = setTimeout(() => setRendered(false), 220);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [open, rendered]);

  // Animate y when open changes (if external y is not driving it)
  useEffect(() => {
    if (yExternal) return;
    animate(y, open ? openY : closedY, { type: "spring", stiffness: 520, damping: 44 });
  }, [open, openY, closedY, y, yExternal]);

  // Keep index valid when tracks change
  useEffect(() => {
    if (!tracks.length) {
      setTrackIndex(0);
      return;
    }
    setTrackIndex((i) => clamp(i, 0, tracks.length - 1));
  }, [tracks.length]);

  const activeTrack = useMemo(() => {
    if (!tracks.length) return null;
    return tracks[clamp(trackIndex, 0, tracks.length - 1)];
  }, [tracks, trackIndex]);

  // Bind audio events ONCE
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => {
      if (seekingRef.current) return;
      setCurrentTime(a.currentTime || 0);
    };

    const onMeta = () => {
      const d = Number.isFinite(a.duration) ? a.duration : 0;
      setDuration(d);
      if (!seekingRef.current) setCurrentTime(a.currentTime || 0);

      // iOS edge-case: sometimes duration is Infinity until it buffers more
      if (a.duration === Infinity) {
        try {
          const old = a.currentTime;
          a.currentTime = 1e101; // forces duration calculation in some Safari cases
          const onFix = () => {
            a.currentTime = old;
            a.removeEventListener("durationchange", onFix);
          };
          a.addEventListener("durationchange", onFix);
        } catch {
          // ignore
        }
      }
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    const onErr = () => {
      const code = a?.error?.code;
      setAudioError(
        `Audio not supported / not found${code ? ` (code ${code})` : ""}: ${a?.src || ""}`
      );
      setPlaying(false);
    };

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("error", onErr);

    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("error", onErr);
    };
  }, []);

  // iOS-friendly “ticker” so progress keeps moving
  useEffect(() => {
    if (!open) return;
    const a = audioRef.current;
    if (!a) return;

    const id = setInterval(() => {
      if (seekingRef.current) return;
      if (!a.paused) setCurrentTime(a.currentTime || 0);
      if (Number.isFinite(a.duration)) setDuration(a.duration || 0);
    }, 200);

    return () => clearInterval(id);
  }, [open]);

  // Set src when active track changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const src = normalizeSrc(activeTrack?.src);
    if (!src) return;

    // If same src, don't reset
    if (a.src && a.src.endsWith(src)) return;

    setAudioError("");
    setCurrentTime(0);
    setDuration(0);

    a.pause();
    a.currentTime = 0;
    a.src = src;

    // Force metadata fetch on mobile (this is the big fix)
    // (Calling load() here is safe because we just paused + swapped src)
    try {
      a.load();
    } catch {
      // ignore
    }
  }, [activeTrack?.src]);

  // Also: when sheet opens, force a load() so metadata appears even before play
  useEffect(() => {
    if (!open) return;
    const a = audioRef.current;
    if (!a || !a.src) return;

    try {
      a.load();
    } catch {
      // ignore
    }
  }, [open]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;

    if (!a.src) {
      const src = normalizeSrc(activeTrack?.src);
      if (!src) return;
      a.src = src;
      try {
        a.load();
      } catch {}
    }

    if (!a.paused) a.pause();
    else safePlay(a);
  };

  const switchToIndex = useCallback(
    (newIndex, forcePlay = true) => {
      if (!tracks.length) return;
      const next = ((newIndex % tracks.length) + tracks.length) % tracks.length;
      setTrackIndex(next);

      // autoplay after React state updates -> do it in next tick
      if (forcePlay) {
        setTimeout(() => {
          const a = audioRef.current;
          if (!a) return;
          safePlay(a);
        }, 0);
      }
    },
    [tracks.length]
  );

  const nextTrack = () => switchToIndex(trackIndex + 1, true);
  const prevTrack = () => switchToIndex(trackIndex - 1, true);

  const seekTo = (t) => {
    const a = audioRef.current;
    if (!a) return;
    const d = Number.isFinite(a.duration) ? a.duration : duration;
    const next = clamp(t, 0, d || 0);
    seekingRef.current = true;
    a.currentTime = next;
    setCurrentTime(next);
    requestAnimationFrame(() => {
      seekingRef.current = false;
    });
  };

  // Keep volume synced
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = clamp(volume, 0, 1);
  }, [volume]);

  const safeDur = Number.isFinite(duration) ? duration : 0;
  const safeCur = Number.isFinite(currentTime) ? Math.min(currentTime, safeDur || 0) : 0;

  if (!rendered) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className={["fixed inset-0 z-[80]", open ? "pointer-events-auto" : "pointer-events-none"].join(" ")}
      >
        <button
          className="absolute inset-0 bg-black/55"
          aria-label="Close control center"
          onClick={onClose}
          type="button"
        />
      </motion.div>

      {/* Sheet */}
      <motion.div
        className={[
          "fixed left-0 right-0 z-[90]",
          "mx-auto w-[min(520px,calc(100%-24px))]",
          "top-3",
          "rounded-[28px] border border-white/12",
          "bg-black/35 backdrop-blur-3xl shadow-2xl",
          "overflow-hidden",
          "md:hidden",
        ].join(" ")}
        initial={false}
        style={{
          y,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        // Drag only from the handle (so scrolling works)
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: openY, bottom: closedY + 560 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          const shouldOpen = info.offset.y > 120 || info.velocity.y > 700;
          if (shouldOpen) {
            // snap open
            animate(y, openY, { type: "spring", stiffness: 520, damping: 44 });
          } else {
            onClose?.();
          }
        }}
      >
        <audio ref={audioRef} preload="metadata" playsInline />

        {/* Drag handle */}
        <div
          className="px-4 pt-3 pb-2"
          onPointerDown={(e) => dragControls.start(e)}
          style={{ touchAction: "none" }}
        >
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/25" />
        </div>

        {/* Scrollable content (this fixes “scroll does not work”) */}
        <div
          className="px-4 pb-4 max-h-[calc(100vh-56px)] overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Top row toggles */}
          <div className="grid grid-cols-4 gap-3">
            <Toggle
              icon={<Airplay className="h-5 w-5" />}
              label="AirDrop"
              active
              onClick={() => {}}
            />
            <Toggle
              icon={<Wifi className="h-5 w-5" />}
              label="Wi-Fi"
              active={toggles.wifi}
              onClick={() => setToggles((t) => ({ ...t, wifi: !t.wifi }))}
            />
            <Toggle
              icon={<Bluetooth className="h-5 w-5" />}
              label="Bluetooth"
              active={toggles.bluetooth}
              onClick={() => setToggles((t) => ({ ...t, bluetooth: !t.bluetooth }))}
            />
            <Toggle
              icon={<Plane className="h-5 w-5" />}
              label="Airplane"
              active={toggles.airplane}
              onClick={() => setToggles((t) => ({ ...t, airplane: !t.airplane }))}
            />
          </div>

          {/* Music card */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] text-white/70">Now Playing</div>
                <div className="mt-0.5 text-sm text-white/90 font-semibold truncate">
                  {activeTrack?.title ?? "No track"}
                </div>
                <div className="text-[12px] text-white/60 truncate">
                  {activeTrack?.artist ?? "—"}
                </div>
                {audioError ? (
                  <div className="mt-2 text-[11px] text-rose-300/90 break-words">
                    {audioError}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevTrack}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/25 text-white/85 active:scale-[0.98]"
                  aria-label="Previous"
                >
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/12 text-white/90 active:scale-[0.98]"
                  aria-label="Play/Pause"
                >
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={nextTrack}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/25 text-white/85 active:scale-[0.98]"
                  aria-label="Next"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-3">
              <ProgressBar
                value={safeCur}
                max={safeDur}
                disabled={!safeDur}
                onSeek={(t) => seekTo(t)}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-white/60 tabular-nums">
                <span>{fmtTime(safeCur)}</span>
                <span>{fmtTime(safeDur)}</span>
              </div>
            </div>

            {/* Track pills */}
            {tracks.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {tracks.map((t, i) => {
                  const active = i === trackIndex;
                  return (
                    <button
                      key={t?.id ?? `${t?.src}-${i}`}
                      type="button"
                      onClick={() => switchToIndex(i, true)}
                      className={[
                        "max-w-full px-2.5 py-1.5 rounded-full border transition",
                        active
                          ? "border-white/25 bg-white/16"
                          : "border-white/12 bg-white/10 hover:bg-white/14",
                      ].join(" ")}
                      title={t?.title || `Track ${i + 1}`}
                    >
                      <span className={["text-[11px] truncate", active ? "text-white/85" : "text-white/65"].join(" ")}>
                        {t?.title || `Track ${i + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Brightness */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/85">
                <Sun className="h-5 w-5" />
                <div className="text-sm">Brightness</div>
              </div>
              <div className="text-xs text-white/60 tabular-nums">{Math.round(brightness * 100)}%</div>
            </div>
            <div className="mt-3">
              <ProgressBar value={brightness} max={1} onSeek={(v) => setBrightness(clamp(v, 0, 1))} />
            </div>
          </div>

          {/* Volume */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/85">
                <Volume2 className="h-5 w-5" />
                <div className="text-sm">Volume</div>
              </div>
              <div className="text-xs text-white/60 tabular-nums">{Math.round(volume * 100)}%</div>
            </div>
            <div className="mt-3">
              <ProgressBar value={volume} max={1} onSeek={(v) => setVolume(clamp(v, 0, 1))} />
            </div>
          </div>

          {/* Shortcuts */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Shortcut icon={<Focus className="h-5 w-5" />} label="Focus" />
            <Shortcut icon={<Flashlight className="h-5 w-5" />} label="Flashlight" />
            <Shortcut icon={<Camera className="h-5 w-5" />} label="Camera" />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/8 px-4 py-2 text-xs text-white/80 hover:bg-white/12"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Toggle({ icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border p-3 text-left transition active:scale-[0.99]",
        active ? "border-white/20 bg-white/14" : "border-white/10 bg-white/6 hover:bg-white/10",
      ].join(" ")}
    >
      <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/25 text-white/85">
        {icon}
      </div>
      <div className="text-[11px] text-white/75">{label}</div>
    </button>
  );
}

function Shortcut({ icon, label }) {
  return (
    <button
      type="button"
      className="rounded-2xl border border-white/10 bg-white/6 p-4 text-left hover:bg-white/10 active:scale-[0.99] transition"
    >
      <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/25 text-white/85">
        {icon}
      </div>
      <div className="text-[11px] text-white/75">{label}</div>
    </button>
  );
}

/**
 * Visible progress bar (Safari-safe)
 * - tap/drag to seek
 */
function ProgressBar({ value, max, disabled, onSeek }) {
  const barRef = useRef(null);
  const draggingRef = useRef(false);

  const pct = max > 0 ? clamp(value / max, 0, 1) : 0;

  const seekFromClientX = (clientX) => {
    if (disabled) return;
    if (!barRef.current || !max) return;
    const rect = barRef.current.getBoundingClientRect();
    const w = rect.width || 1;
    const x = clamp(clientX - rect.left, 0, w);
    const t = (x / w) * max;
    onSeek?.(t);
  };

  const onPointerDown = (e) => {
    if (disabled) return;
    draggingRef.current = true;
    try {
      barRef.current?.setPointerCapture?.(e.pointerId);
    } catch {}
    seekFromClientX(e.clientX);
  };

  const onPointerMove = (e) => {
    if (disabled) return;
    if (!draggingRef.current) return;
    seekFromClientX(e.clientX);
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  return (
    <div className="w-full">
      <div
        ref={barRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={[
          "relative h-2.5 w-full rounded-full",
          "border border-white/12",
          disabled ? "bg-white/8 opacity-60" : "bg-white/12 hover:bg-white/14",
          "overflow-hidden select-none",
        ].join(" ")}
        style={{ touchAction: "none" }}
        role="slider"
        aria-label="Slider"
        aria-valuemin={0}
        aria-valuemax={max || 0}
        aria-valuenow={Math.floor(value || 0)}
      >
        <div className="absolute left-0 top-0 h-full rounded-full bg-white/70" style={{ width: `${pct * 100}%` }} />
        <div
          className={[
            "absolute top-1/2 -translate-y-1/2",
            "h-4 w-4 rounded-full",
            "bg-white shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
            "border border-white/30",
          ].join(" ")}
          style={{ left: `calc(${pct * 100}% - 8px)` }}
        />
      </div>
    </div>
  );
}
