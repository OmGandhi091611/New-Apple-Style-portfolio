// src/components/DesktopControlCenter.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Wifi,
  Bluetooth,
  Send,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Moon,
  Sun,
  Volume2,
  Copy,
  RectangleHorizontal,
  Flashlight,
  Camera,
  Airplay,
} from "lucide-react";
import { MUSIC_TRACKS } from "#constants";

// ✅ shared audio (same as mobile)
import { subscribeAudio, audioActions } from "../lib/audioController";

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

export default function DesktopControlCenter({ open, anchorRect, onRequestClose }) {
  const style = useMemo(() => {
    const gap = 10;
    if (!anchorRect) return { top: 56 + gap, right: 24 };
    const top = Math.round(anchorRect.bottom + gap);
    const right = Math.max(12, Math.round(window.innerWidth - anchorRect.right));
    return { top, right };
  }, [anchorRect]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onRequestClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onRequestClose]);

  const [wifiOn, setWifiOn] = useState(true);
  const [btOn, setBtOn] = useState(true);
  const [airdropMode, setAirdropMode] = useState("Everyone");

  const [stageOn, setStageOn] = useState(false);
  const [mirrorOn, setMirrorOn] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [focusOn, setFocusOn] = useState(false);

  // Keep brightness local but apply to CSS var (your App overlay uses this)
  const [brightness, setBrightness] = useState(0.85);

  // ✅ shared audio state
  const [audioState, setAudioState] = useState(() => ({
    tracks: [],
    index: 0,
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.55,
    error: "",
  }));

  // ✅ initialize tracks into shared controller (so changes in constants reflect)
  useEffect(() => {
    audioActions.initTracks(MUSIC_TRACKS);
  }, [MUSIC_TRACKS]);

  // ✅ subscribe to shared audio updates
  useEffect(() => {
    const unsub = subscribeAudio(setAudioState);
    return unsub;
  }, []);

  // ✅ brightness var for overlay; keep it 0..1 because your overlay does calc(1 - brightness)
  useEffect(() => {
    const v = clamp(brightness, 0, 1);
    document.documentElement.style.setProperty("--ui-brightness", String(v));
    // IMPORTANT: do NOT remove on unmount; otherwise mobile/desktop popovers will "reset" it
  }, [brightness]);

  const activeTrack = useMemo(() => {
    const t = audioState.tracks?.[audioState.index];
    return t || null;
  }, [audioState.tracks, audioState.index]);

  const safeDur = Math.max(0, audioState.duration || 0);
  const safeCur = Math.min(audioState.currentTime || 0, safeDur);

  const cycleAirdrop = () => {
    setAirdropMode((m) =>
      m === "Everyone" ? "Contacts Only" : m === "Contacts Only" ? "Off" : "Everyone"
    );
  };

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-[199]",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        onMouseDown={onRequestClose}
      />

      <motion.div
        initial={false}
        animate={open ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.985, y: -8 }}
        transition={{ type: "spring", stiffness: 520, damping: 44 }}
        style={style}
        className={[
          "fixed z-[200]",
          "w-[340px] max-w-[92vw]",
          "rounded-[28px]",
          "border border-white/12",
          "bg-zinc-950/70",
          "backdrop-blur-3xl backdrop-saturate-150",
          "shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
          "p-4",
          open ? "pointer-events-auto" : "pointer-events-none",
          "origin-top-right",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-3">
            <MacPill
              active={wifiOn}
              icon={<Wifi className="h-5 w-5" />}
              iconColor={wifiOn ? "text-sky-500" : "text-white/75"}
              title="Wi-Fi"
              subtitle={wifiOn ? "NETGEAR39\n-5G" : "Off"}
              onClick={() => setWifiOn((v) => !v)}
            />
            <MacPill
              active={btOn}
              icon={<Bluetooth className="h-5 w-5" />}
              iconColor={btOn ? "text-blue-500" : "text-white/75"}
              title="Bluetooth"
              subtitle={btOn ? "On" : "Off"}
              onClick={() => setBtOn((v) => !v)}
            />
            <MacPill
              active={airdropMode !== "Off"}
              icon={<Send className="h-5 w-5" />}
              iconColor={airdropMode !== "Off" ? "text-cyan-400" : "text-white/75"}
              title="AirDrop"
              subtitle={airdropMode}
              onClick={cycleAirdrop}
            />
          </div>

          <div className="space-y-3">
            <NowPlaying
              title={activeTrack?.title || "No Track"}
              subtitle={activeTrack?.artist || "Add /public/audio/*.mp3"}
              playing={!!audioState.playing}
              onPrev={audioActions.prev}
              onNext={audioActions.next}
              onToggle={audioActions.togglePlay}
              disabled={!audioState.tracks?.length}
            />

            {/* ✅ desktop progress bar now uses shared currentTime/duration */}
            <div className="rounded-[24px] border border-white/12 bg-white/10 p-3">
              <SeekBar
                value={safeCur}
                max={safeDur}
                disabled={!audioState.tracks?.length || !safeDur}
                onChange={(t) => audioActions.seekTo(t)}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-white/55">
                <span>{fmtTime(safeCur)}</span>
                <span>{fmtTime(safeDur)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CircleBtn
                active={stageOn}
                onClick={() => setStageOn((v) => !v)}
                variant="dark"
                icon={<RectangleHorizontal className="h-6 w-6" />}
              />
              <CircleBtn
                active={mirrorOn}
                onClick={() => setMirrorOn((v) => !v)}
                variant="activeWhite"
                icon={<Copy className="h-6 w-6" />}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <CircleBtn
            active={flashOn}
            onClick={() => setFlashOn((v) => !v)}
            variant={flashOn ? "activeWhite" : "dark"}
            icon={<Flashlight className="h-6 w-6" />}
          />
          <CircleBtn
            active={camOn}
            onClick={() => setCamOn((v) => !v)}
            variant={camOn ? "activeWhite" : "dark"}
            icon={<Camera className="h-6 w-6" />}
          />

          <button
            type="button"
            onClick={() => setFocusOn((v) => !v)}
            className={[
              "flex-1 h-16 rounded-full",
              "border border-white/12",
              "bg-white/10 hover:bg-white/14 transition",
              "px-4 flex items-center gap-3",
            ].join(" ")}
          >
            <div
              className={[
                "h-10 w-10 rounded-full grid place-items-center",
                "border border-white/12",
                focusOn ? "bg-white" : "bg-white/16",
              ].join(" ")}
            >
              <Moon className={focusOn ? "h-5 w-5 text-zinc-900" : "h-5 w-5 text-white/80"} />
            </div>
            <div className="text-[13px] font-semibold text-white/85">Focus</div>
          </button>
        </div>

        <SliderCard
          title="Display"
          leftIcon={<Sun className="h-4 w-4 text-white/60" />}
          rightIcon={<Sun className="h-5 w-5 text-white/85" />}
          value={brightness}
          onChange={(v) => setBrightness(clamp(v, 0, 1))}
        />

        {/* ✅ Sound uses shared volume */}
        <div className="mt-3 rounded-[22px] border border-white/12 bg-white/10 px-4 py-3 relative">
          <div className="text-[13px] font-semibold text-white/80 mb-2">Sound</div>
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-white/60" />
            <SeekBar
              value={audioState.volume || 0}
              max={1}
              onChange={(v) => audioActions.setVolume(v)}
              disabled={!audioState.tracks?.length}
            />
            <Volume2 className="h-5 w-5 text-white/85" />
          </div>

          <button
            type="button"
            className="absolute right-3 bottom-3 h-9 w-9 rounded-full border border-white/12 bg-white/12 hover:bg-white/16 transition grid place-items-center"
            onClick={() => {}}
            aria-label="Output"
            title="Output"
          >
            <Airplay className="h-4 w-4 text-white/75" />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="rounded-full border border-white/12 bg-white/10 px-5 py-2 text-[12px] text-white/70 hover:bg-white/14 transition"
            onClick={() => {}}
          >
            Edit Controls
          </button>
        </div>

        {audioState.error ? (
          <div className="mt-3 text-[11px] text-red-300 break-words">{audioState.error}</div>
        ) : null}
      </motion.div>
    </>
  );
}

function MacPill({ active, icon, iconColor, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-[22px] border border-white/12",
        "bg-white/10 hover:bg-white/14 transition",
        "px-4 py-3 text-left",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "h-11 w-11 rounded-full grid place-items-center",
            "border border-white/12",
            active ? "bg-white" : "bg-white/16",
          ].join(" ")}
        >
          <div className={active ? iconColor : "text-white/80"}>{icon}</div>
        </div>

        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white/85 leading-tight">{title}</div>
          <div className="text-[12px] text-white/60 whitespace-pre-line leading-[1.1]">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function NowPlaying({ title, subtitle, playing, onPrev, onNext, onToggle, disabled }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/10 p-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl border border-white/12 bg-white/12" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-white/85 truncate">{title}</div>
          <div className="text-[12px] text-white/55 truncate">{subtitle}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-white/80">
        <GhostBtn onClick={onPrev} disabled={disabled} aria="Previous">
          <SkipBack className="h-5 w-5" />
        </GhostBtn>

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="h-9 w-9 rounded-xl bg-white/12 hover:bg-white/16 disabled:opacity-40 transition grid place-items-center"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        <GhostBtn onClick={onNext} disabled={disabled} aria="Next">
          <SkipForward className="h-5 w-5" />
        </GhostBtn>
      </div>
    </div>
  );
}

function GhostBtn({ children, onClick, disabled, aria }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      className="h-9 w-9 rounded-xl hover:bg-white/12 disabled:opacity-40 transition grid place-items-center"
    >
      {children}
    </button>
  );
}

function CircleBtn({ icon, active, onClick, variant }) {
  const base = "h-16 w-full rounded-full border border-white/12 grid place-items-center transition";
  if (variant === "activeWhite") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[base, active ? "bg-white" : "bg-white/12 hover:bg-white/16"].join(" ")}
        aria-pressed={active}
      >
        <div className={active ? "text-blue-500" : "text-white/75"}>{icon}</div>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={[base, "bg-white/12 hover:bg-white/16"].join(" ")}
      aria-pressed={active}
    >
      <div className="text-white/75">{icon}</div>
    </button>
  );
}

function SliderCard({ title, leftIcon, rightIcon, value, onChange }) {
  return (
    <div className="mt-3 rounded-[22px] border border-white/12 bg-white/10 px-4 py-3">
      <div className="text-[13px] font-semibold text-white/80 mb-2">{title}</div>
      <div className="flex items-center gap-3">
        {leftIcon}
        <SeekBar value={value} max={1} onChange={onChange} />
        {rightIcon}
      </div>
    </div>
  );
}

function SeekBar({ value, max, onChange, disabled = false }) {
  const trackRef = useRef(null);
  const draggingRef = useRef(false);

  const safeMax = Math.max(0, max || 0);
  const safeVal = clamp(value || 0, 0, safeMax || 1);
  const pct = safeMax > 0 ? safeVal / safeMax : 0;

  const setFromClientX = (clientX) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
    onChange?.(t * safeMax);
  };

  const onPointerDown = (e) => {
    if (disabled) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };

  const onPointerMove = (e) => {
    if (disabled) return;
    if (!draggingRef.current) return;
    setFromClientX(e.clientX);
  };

  const onPointerUp = () => {
    draggingRef.current = false;
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "none" }}
      className={[
        "relative h-2.5 w-full rounded-full overflow-hidden cursor-pointer",
        "bg-white/20",
        disabled ? "opacity-50" : "opacity-100",
      ].join(" ")}
      aria-hidden="true"
    >
      <div className="absolute left-0 top-0 h-full bg-white/85" style={{ width: `${pct * 100}%` }} />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
        style={{ left: `calc(${pct * 100}% - 8px)` }}
      />
    </div>
  );
}
