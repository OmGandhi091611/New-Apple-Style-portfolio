// src/components/ControlCenter.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, animate, useDragControls, useMotionValue } from "framer-motion";
import {
  Airplay,
  Wifi,
  Bluetooth,
  Plane,
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
import { subscribeAudio, audioActions } from "../lib/audioController";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function ControlCenter({
  open,
  onClose,
  closedY = -560,
  openY = 0,
  yExternal,
  initialBrightness = 0.85,
}) {
  const y = yExternal ?? useMotionValue(closedY);
  const dragControls = useDragControls();

  // local UI toggles
  const [toggles, setToggles] = useState({ wifi: true, bluetooth: true, airplane: false });

  // brightness + shared audio state
  const [brightness, setBrightness] = useState(initialBrightness);
  const [audioState, setAudioState] = useState(() => ({
    tracks: [],
    index: 0,
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.55,
    error: "",
  }));

  const [rendered, setRendered] = useState(open);
  const closeTimerRef = useRef(null);

  // Init tracks into the shared controller whenever constants change
  useEffect(() => {
    audioActions.initTracks(MUSIC_TRACKS);
  }, [MUSIC_TRACKS]);

  // Subscribe to shared audio
  useEffect(() => {
    const unsub = subscribeAudio(setAudioState);
    return unsub;
  }, []);

  const activeTrack = useMemo(() => {
    const t = audioState.tracks?.[audioState.index];
    return t || null;
  }, [audioState.tracks, audioState.index]);

  // Brightness overlay driver
  useEffect(() => {
    const v = clamp(brightness, 0, 1);
    document.documentElement.style.setProperty("--ui-brightness", String(v));
  }, [brightness]);

  // Mount/unmount for animation
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

  // Animate y if not external-driven
  useEffect(() => {
    if (yExternal) return;
    animate(y, open ? openY : closedY, { type: "spring", stiffness: 520, damping: 44 });
  }, [open, openY, closedY, y, yExternal]);

  if (!rendered) return null;

  const safeDur = Number.isFinite(audioState.duration) ? audioState.duration : 0;
  const safeCur = Number.isFinite(audioState.currentTime) ? Math.min(audioState.currentTime, safeDur || 0) : 0;

  const constraintTop = Math.min(closedY, openY);
  const constraintBottom = Math.max(closedY, openY);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className={["fixed inset-0 z-[80]", open ? "pointer-events-auto" : "pointer-events-none"].join(" ")}
      >
        <button className="absolute inset-0 bg-black/55" aria-label="Close control center" onClick={onClose} type="button" />
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
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: constraintTop, bottom: constraintBottom }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          // close if dragged up enough
          const shouldClose = info.offset.y < -110 || info.velocity.y < -700;
          if (shouldClose) onClose?.();
          else animate(y, openY, { type: "spring", stiffness: 520, damping: 44 });
        }}
      >
        {/* Drag handle */}
        <div className="px-4 pt-3 pb-2" onPointerDown={(e) => dragControls.start(e)} style={{ touchAction: "none" }}>
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/25" />
        </div>

        {/* Scrollable content */}
        <div className="px-4 pb-4 max-h-[calc(100vh-56px)] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Quick toggles */}
          <div className="grid grid-cols-4 gap-3">
            <Toggle icon={<Airplay className="h-5 w-5" />} label="AirDrop" active onClick={() => {}} />
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

          {/* Now Playing (like desktop — track + artist + progress + time) */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] text-white/70">Now Playing</div>
                <div className="mt-0.5 text-sm text-white/90 font-semibold truncate">
                  {activeTrack?.title || "No tracks added"}
                </div>
                <div className="text-[12px] text-white/60 truncate">
                  {activeTrack?.artist || "Add audio files in /public/audio"}
                </div>
                {audioState.error ? (
                  <div className="mt-2 text-[11px] text-rose-300/90 break-words">{audioState.error}</div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={audioActions.prev}
                  disabled={!audioState.tracks.length}
                  className={[
                    "grid h-10 w-10 place-items-center rounded-xl border border-white/10",
                    audioState.tracks.length ? "bg-black/25 text-white/85" : "bg-white/5 opacity-60",
                    "active:scale-[0.98]",
                  ].join(" ")}
                  aria-label="Previous"
                >
                  <SkipBack className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={audioActions.togglePlay}
                  disabled={!audioState.tracks.length}
                  className={[
                    "grid h-10 w-10 place-items-center rounded-xl border border-white/10",
                    audioState.tracks.length ? "bg-white/12 text-white/90" : "bg-white/5 opacity-60",
                    "active:scale-[0.98]",
                  ].join(" ")}
                  aria-label="Play/Pause"
                >
                  {audioState.playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>

                <button
                  type="button"
                  onClick={audioActions.next}
                  disabled={!audioState.tracks.length}
                  className={[
                    "grid h-10 w-10 place-items-center rounded-xl border border-white/10",
                    audioState.tracks.length ? "bg-black/25 text-white/85" : "bg-white/5 opacity-60",
                    "active:scale-[0.98]",
                  ].join(" ")}
                  aria-label="Next"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Progress + times */}
            <div className="mt-3">
              <ProgressBar
                value={safeCur}
                max={safeDur}
                disabled={!safeDur}
                onSeek={(t) => audioActions.seekTo(t)}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-white/60 tabular-nums">
                <span>{fmtTime(safeCur)}</span>
                <span>{fmtTime(safeDur)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-white/60">
                <span>Volume</span>
                <span className="tabular-nums">{Math.round((audioState.volume || 0) * 100)}%</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-white/60" />
                <div className="flex-1">
                  <ProgressBar
                    value={audioState.volume || 0}
                    max={1}
                    disabled={!audioState.tracks.length}
                    onSeek={(v) => audioActions.setVolume(v)}
                  />
                </div>
                <Volume2 className="h-5 w-5 text-white/85" />
              </div>
            </div>
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
    <button type="button" className="rounded-2xl border border-white/10 bg-white/6 p-4 text-left hover:bg-white/10 active:scale-[0.99] transition">
      <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/25 text-white/85">
        {icon}
      </div>
      <div className="text-[11px] text-white/75">{label}</div>
    </button>
  );
}

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
    <div
      ref={barRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={[
        "relative h-2.5 w-full rounded-full overflow-hidden select-none",
        "border border-white/12",
        disabled ? "bg-white/8 opacity-60" : "bg-white/12 hover:bg-white/14",
      ].join(" ")}
      style={{ touchAction: "pan-y" }}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={max || 0}
      aria-valuenow={Math.floor(value || 0)}
    >
      <div className="absolute left-0 top-0 h-full rounded-full bg-white/70" style={{ width: `${pct * 100}%` }} />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white border border-white/30"
        style={{ left: `calc(${pct * 100}% - 8px)` }}
      />
    </div>
  );
}
