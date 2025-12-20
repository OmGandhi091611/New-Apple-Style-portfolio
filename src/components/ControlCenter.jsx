// src/components/ControlCenter.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, animate, useMotionValue, useDragControls } from "framer-motion";
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

function safePlay(a) {
  if (!a) return;
  const p = a.play();
  if (p && typeof p.catch === "function") {
    p.catch((err) => {
      if (err?.name === "AbortError") return;
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

  const [brightness, setBrightness] = useState(initialBrightness);
  const [volume, setVolume] = useState(initialVolume);

  const [toggles, setToggles] = useState({
    wifi: true,
    bluetooth: true,
    airplane: false,
    dnd: false,
  });

  // ---- Audio ----
  const tracks = Array.isArray(MUSIC_TRACKS) ? MUSIC_TRACKS : [];
  const [trackIndex, setTrackIndex] = useState(0);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState("");

  const [output, setOutput] = useState("iPhone Speaker");
  const audioRef = useRef(null);
  const seekingRef = useRef(false);

  const activeTrack = tracks.length
    ? tracks[clamp(trackIndex, 0, tracks.length - 1)]
    : null;

  // Mount only while open or animating out
  const [rendered, setRendered] = useState(open);
  const closeTimerRef = useRef(null);

  const quickButtons = useMemo(
    () => [
      { key: "airplane", label: "Airplane", Icon: Plane, active: toggles.airplane },
      { key: "wifi", label: "Wi-Fi", Icon: Wifi, active: toggles.wifi },
      { key: "bluetooth", label: "Bluetooth", Icon: Bluetooth, active: toggles.bluetooth },
      { key: "dnd", label: "Do Not Disturb", Icon: Moon, active: toggles.dnd },
    ],
    [toggles]
  );

  const toggle = (k) => setToggles((p) => ({ ...p, [k]: !p[k] }));

  // Render lifecycle
  useEffect(() => {
    if (open) {
      setRendered(true);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    } else {
      closeTimerRef.current = setTimeout(() => setRendered(false), 220);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [open]);

  // Animate open/close
  useEffect(() => {
    animate(y, open ? openY : closedY, {
      type: "spring",
      stiffness: 520,
      damping: 44,
    });
  }, [open, y, openY, closedY]);

  // Prevent background scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Pause audio on close
  useEffect(() => {
    if (open) return;
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setPlaying(false);
  }, [open]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Apply brightness “simulation”
  useEffect(() => {
    const v = clamp(brightness, 0.25, 1.25);
    document.documentElement.style.setProperty("--ui-brightness", String(v));
    return () => {
      document.documentElement.style.removeProperty("--ui-brightness");
    };
  }, [brightness]);

  // Volume -> audio element
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = clamp(volume, 0, 1);
  }, [volume]);

  // Audio events
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
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    const onErr = () => {
      const code = a?.error?.code;
      setAudioError(
        `Audio source not supported or not found${code ? ` (code ${code})` : ""}: ${a?.src || ""}`
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

  // ✅ iOS-friendly “ticker” (keeps progress moving even if timeupdate is sparse)
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

  // Ensure initial src
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!tracks.length) return;

    const src = tracks[0]?.src;
    if (!src) return;

    if (!a.src || !a.src.endsWith(src)) {
      a.src = src;
      setAudioError("");
      setCurrentTime(0);
      setDuration(0);
    }
  }, [tracks]);

  // Switch Track (Safari-safe)
  const switchToIndexRef = useRef(null);

  const switchToIndex = useCallback(
    (newIndex, forcePlay = true) => {
      if (!tracks.length) return;
      const a = audioRef.current;
      if (!a) return;

      const next = ((newIndex % tracks.length) + tracks.length) % tracks.length;
      const nextSrc = tracks[next]?.src;
      if (!nextSrc) return;

      setAudioError("");
      setCurrentTime(0);
      setDuration(0);

      a.pause();
      a.currentTime = 0;
      a.src = nextSrc;

      setTrackIndex(next);

      if (!forcePlay) {
        setPlaying(false);
        return;
      }

      const onCanPlay = () => safePlay(a);
      if (a.readyState >= 2) safePlay(a);
      else a.addEventListener("canplay", onCanPlay, { once: true });

      return () => a.removeEventListener("canplay", onCanPlay);
    },
    [tracks]
  );

  useEffect(() => {
    switchToIndexRef.current = switchToIndex;
  }, [switchToIndex]);

  // Auto-next
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onEnded = () => {
      if (!tracks.length) return;
      switchToIndexRef.current?.(trackIndex + 1, true);
    };

    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [trackIndex, tracks.length]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a || !tracks.length) return;

    if (!a.paused) {
      a.pause();
      return;
    }

    if (!a.src && activeTrack?.src) a.src = activeTrack.src;
    safePlay(a);
  };

  const nextTrack = () => switchToIndex(trackIndex + 1, true);
  const prevTrack = () => switchToIndex(trackIndex - 1, true);

  const seekTo = (t) => {
    const a = audioRef.current;
    if (!a) return;
    const d = Number.isFinite(a.duration) ? a.duration : duration;
    const next = clamp(t, 0, d || 0);
    a.currentTime = next;
    setCurrentTime(next);
  };

  if (!rendered) return null;

  const safeDur = Number.isFinite(duration) ? duration : 0;
  const safeCur = Number.isFinite(currentTime) ? Math.min(currentTime, safeDur || 0) : 0;
  const pct = safeDur > 0 ? Math.round((safeCur / safeDur) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className={["fixed inset-0 z-[80]", open ? "pointer-events-auto" : "pointer-events-none"].join(
          " "
        )}
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
          "overflow-hidden", // keep corners clean
          "md:hidden",
        ].join(" ")}
        initial={false}
        style={{
          y,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
        }}
        drag="y"
        dragControls={dragControls}
        dragListener={false} // ✅ drag only from handle
        dragConstraints={{ top: closedY, bottom: openY }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          const vy = info.velocity.y;
          const dy = info.offset.y;
          const shouldClose = dy < -80 || vy < -600;
          if (shouldClose) onClose?.();
          else animate(y, openY, { type: "spring", stiffness: 520, damping: 44 });
        }}
      >
        {/* Audio */}
        <audio ref={audioRef} preload="metadata" playsInline />

        {/* Grab handle (ONLY place that starts drag) */}
        <div className="flex justify-center pt-3">
          <button
            type="button"
            aria-label="Drag control center"
            onPointerDown={(e) => dragControls.start(e)}
            className="h-6 w-20 grid place-items-center"
            style={{ touchAction: "none" }}
          >
            <div className="h-1.5 w-12 rounded-full bg-white/25" />
          </button>
        </div>

        {/* ✅ SCROLL CONTAINER (this is the main fix) */}
        <div
          className="p-4 overflow-y-auto overscroll-contain"
          style={{
            maxHeight: "calc(100dvh - 84px)", // leaves space for handle/top padding
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          }}
        >
          {/* Top row */}
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs text-white/70">Control Center</div>

            <button
              type="button"
              onClick={() => setOutput((p) => (p === "iPhone Speaker" ? "AirPods Pro" : "iPhone Speaker"))}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
            >
              <Airplay className="h-4 w-4" />
              <span>{output}</span>
            </button>
          </div>

          {/* Quick toggles */}
          <div className="grid grid-cols-4 gap-3">
            {quickButtons.map(({ key, label, Icon, active }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={[
                  "rounded-2xl border border-white/10 p-3 text-left",
                  active ? "bg-white/18" : "bg-white/6 hover:bg-white/10",
                ].join(" ")}
              >
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/25">
                  <Icon className="h-5 w-5 text-white/85" />
                </div>
                <div className="text-[11px] text-white/80 leading-tight">{label}</div>
                <div className="mt-1 text-[10px] text-white/50">{active ? "On" : "Off"}</div>
              </button>
            ))}
          </div>

          {/* Brightness */}
          <div className="mt-4">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/25">
                    <Sun className="h-5 w-5 text-white/85" />
                  </div>
                  <div className="text-sm font-medium text-white/85">Brightness</div>
                </div>
                <div className="text-[11px] text-white/55 tabular-nums">{Math.round(brightness * 100)}%</div>
              </div>

              <ProgressBar value={brightness} max={1} disabled={false} onSeek={(v) => setBrightness(clamp(v, 0, 1))} />
            </div>
          </div>

          {/* Now Playing */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white/90 truncate">
                  {activeTrack?.title || "No tracks added"}
                </div>
                <div className="text-xs text-white/55 truncate">
                  {activeTrack?.artist || "Add audio files in /public/audio"}
                </div>
              </div>

              <button
                type="button"
                onClick={togglePlay}
                disabled={!tracks.length}
                className={[
                  "grid h-11 w-11 place-items-center rounded-2xl border border-white/10",
                  tracks.length ? "bg-white/10 hover:bg-white/15" : "bg-white/5 opacity-60",
                  "active:scale-95 transition",
                ].join(" ")}
              >
                {playing ? <Pause className="h-5 w-5 text-white/85" /> : <Play className="h-5 w-5 text-white/85" />}
              </button>
            </div>

            {/* Song completion progress */}
            <div className="mt-3">
              <ProgressBar value={safeCur} max={safeDur} disabled={!tracks.length || safeDur <= 0} onSeek={seekTo} />

              <div className="mt-1 flex items-center justify-between text-[11px] text-white/55 tabular-nums">
                <span>{fmtTime(safeCur)}</span>
                <span>{pct}%</span>
                <span>{fmtTime(safeDur)}</span>
              </div>

              {audioError ? <div className="mt-2 text-[11px] text-red-300 break-words">{audioError}</div> : null}
            </div>

            {/* Volume */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-white/55">
                <span>Volume</span>
                <span className="tabular-nums">{Math.round(volume * 100)}%</span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-white/60" />
                <div className="flex-1">
                  <ProgressBar value={volume} max={1} disabled={!tracks.length} onSeek={(v) => setVolume(clamp(v, 0, 1))} />
                </div>
                <Volume2 className="h-5 w-5 text-white/85" />
              </div>
            </div>

            {/* Transport */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={prevTrack}
                disabled={!tracks.length}
                className={[
                  "grid h-11 w-11 place-items-center rounded-2xl border border-white/10",
                  tracks.length ? "bg-white/6 hover:bg-white/10" : "bg-white/5 opacity-60",
                  "active:scale-95 transition",
                ].join(" ")}
              >
                <SkipBack className="h-5 w-5 text-white/80" />
              </button>

              <button
                type="button"
                className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-xs text-white/70 hover:bg-white/10"
                onClick={() => setOutput((p) => (p === "iPhone Speaker" ? "AirPods Pro" : "iPhone Speaker"))}
              >
                Output: <span className="text-white/85">{output}</span>
              </button>

              <button
                type="button"
                onClick={nextTrack}
                disabled={!tracks.length}
                className={[
                  "grid h-11 w-11 place-items-center rounded-2xl border border-white/10",
                  tracks.length ? "bg-white/6 hover:bg-white/10" : "bg-white/5 opacity-60",
                  "active:scale-95 transition",
                ].join(" ")}
              >
                <SkipForward className="h-5 w-5 text-white/80" />
              </button>
            </div>

            {/* Track pills */}
            {tracks.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {tracks.map((t, i) => {
                  const isActive = i === trackIndex;
                  return (
                    <button
                      key={t?.id ?? `${t?.src}-${i}`}
                      type="button"
                      onClick={() => switchToIndex(i, true)}
                      className={[
                        "max-w-full",
                        "px-2.5 py-1.5 rounded-full border",
                        isActive ? "border-white/25 bg-white/16" : "border-white/12 bg-white/10 hover:bg-white/14",
                        "transition",
                      ].join(" ")}
                      title={t?.title || `Track ${i + 1}`}
                    >
                      <span className={["text-[11px] truncate", isActive ? "text-white/85" : "text-white/65"].join(" ")}>
                        {t?.title || `Track ${i + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
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
 * Progress bar for:
 * - song completion (value=currentTime, max=duration)
 * - volume (value=0..1, max=1)
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
