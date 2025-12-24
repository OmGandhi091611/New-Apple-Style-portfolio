// src/components/Dock.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Music, X, Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";

import { MUSIC_TRACKS } from "#constants";
import { subscribeAudio, audioActions } from "../lib/audioController";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function useIsMobileMd() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return isMobile;
}

function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function isTerminalItem(item) {
  if (item?.type) return item.type === "terminal";
  const label = (item?.label || "").toLowerCase();
  return item?.id === "terminal" || label === "terminal";
}

function isMusicItem(item) {
  const t = (item?.type || "").toLowerCase();
  const id = (item?.id || "").toLowerCase();
  const label = (item?.label || "").toLowerCase();
  return t === "music" || id === "music" || label === "music";
}

/**
 * items = [
 *  { id, type?, label, icon, iconBg, onClick, active }
 * ]
 */
export default function Dock({ items = [], iconRefs, pinnedCount = 5 }) {
  const isMobile = useIsMobileMd();

  // ----- shared audio state -----
  const [audioState, setAudioState] = useState(() => ({
    tracks: [],
    index: 0,
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.55,
    error: "",
  }));

  // ----- dock-managed music popup state -----
  const [musicOpen, setMusicOpen] = useState(false);

  // ✅ NEW: unlock WebAudio once on the first user tap on Music
  const didUnlockRef = useRef(false);

  // Init tracks once
  useEffect(() => {
    audioActions.initTracks(MUSIC_TRACKS);
  }, []);

  // Subscribe to shared audio
  useEffect(() => {
    const unsub = subscribeAudio(setAudioState);
    return unsub;
  }, []);

  // Close music popup on Esc
  useEffect(() => {
    if (!musicOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMusicOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [musicOpen]);

  // If user didn't add a Music item in DOCK_APPS, inject one automatically
  const computedItems = useMemo(() => {
    const base = [...items];
    const hasMusic = base.some(isMusicItem);

    if (!hasMusic) {
      // Insert near the front (after pinned apps zone) so it doesn't feel random
      base.splice(Math.min(base.length, pinnedCount), 0, {
        id: "music",
        type: "music",
        label: "Music",
        icon: null,
        iconBg: "bg-gradient-to-br from-pink-500/80 to-purple-600/80",
        onClick: () => {},
        active: false,
      });
    }

    return base;
  }, [items, pinnedCount]);

  const handleItemClick = (item) => {
    if (isMusicItem(item)) {
      // ✅ Unlock WebAudio on the very first tap so iOS volume works immediately
      if (!didUnlockRef.current) {
        try {
          audioActions.unlock?.();
        } catch {}
        didUnlockRef.current = true;
      }

      setMusicOpen((v) => !v);
      return;
    }
    item?.onClick?.();
  };

  // Mobile: keep your home screen + dock pill, no desktop icons grid.
  if (isMobile) {
    const mobileItems = computedItems.filter((i) => !isTerminalItem(i));
    return (
      <>
        <MobileHomeScreen items={mobileItems} onItemClick={handleItemClick} iconRefs={iconRefs} />

        {musicOpen && (
          <MusicPopup isMobile onClose={() => setMusicOpen(false)} audioState={audioState} />
        )}

        <MobileDockPill
          items={mobileItems}
          iconRefs={iconRefs}
          pinnedCount={pinnedCount}
          onItemClick={handleItemClick}
        />
      </>
    );
  }

  // Desktop: ONLY the dock + centered popup
  return (
    <>
      {musicOpen && <MusicPopup isMobile={false} onClose={() => setMusicOpen(false)} audioState={audioState} />}

      <DesktopDock items={computedItems} iconRefs={iconRefs} onItemClick={handleItemClick} />
    </>
  );
}

/* =========================
   Desktop Dock
   ========================= */
function DesktopDock({ items = [], iconRefs, onItemClick }) {
  const [hoveredId, setHoveredId] = useState(null);

  const hoveredIndex = useMemo(() => {
    if (!hoveredId) return -1;
    return items.findIndex((i) => i.id === hoveredId);
  }, [hoveredId, items]);

  return (
    <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-50 flex justify-center">
      <div
        className={[
          "pointer-events-auto relative",
          "rounded-3xl border border-white/15",
          "bg-white/10 backdrop-blur-2xl shadow-2xl",
          "px-3 py-2",
        ].join(" ")}
        onMouseLeave={() => setHoveredId(null)}
      >
        <div className="flex items-end gap-2">
          {items.map((item, idx) => {
            const distance = hoveredIndex === -1 ? 999 : Math.abs(idx - hoveredIndex);

            const neighborBoost = clamp(1.38 - distance * 0.2, 1, 1.38);
            const hoverBoost = hoveredId === item.id ? 1.08 : 1.0;
            const scale = neighborBoost * hoverBoost;

            return (
              <DesktopDockIcon
                key={item.id}
                item={item}
                scale={scale}
                hovered={hoveredId === item.id}
                onEnter={() => setHoveredId(item.id)}
                onClick={() => onItemClick(item)}
                iconRefs={iconRefs}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DesktopDockIcon({ item, scale, hovered, onEnter, onClick, iconRefs }) {
  const isMusic = isMusicItem(item);

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={onEnter}
      ref={(el) => {
        if (!iconRefs?.current) return;
        iconRefs.current[item.id] = el;
      }}
    >
      <div
        className={[
          "pointer-events-none absolute -top-10",
          "rounded-md border border-white/15 bg-black/60 backdrop-blur-xl",
          "px-2 py-1 text-[11px] text-white/90 shadow-lg",
          "transition-all duration-150",
          hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
        ].join(" ")}
      >
        {item.label}
      </div>

      <button
        onClick={onClick}
        className={[
          "group relative grid place-items-center",
          "h-14 w-14 rounded-2xl",
          "bg-white/10 border border-white/10",
          "shadow-lg",
          "transition-transform duration-150 ease-out",
          "hover:bg-white/15 active:scale-95",
        ].join(" ")}
        style={{ transform: `scale(${scale})` }}
        aria-label={item.label}
        type="button"
      >
        <div
          className={[
            "relative h-12 w-12 rounded-2xl grid place-items-center",
            "shadow-inner shadow-black/20",
            item.iconBg || "bg-white/10",
          ].join(" ")}
        >
          <div className="h-7 w-7 text-white opacity-95">
            {isMusic ? <Music className="h-full w-full" strokeWidth={1.8} /> : item.icon}
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent opacity-40" />
        </div>
      </button>

      <div className={["mt-1 h-1 w-1 rounded-full", item.active ? "bg-white/80" : "bg-transparent"].join(" ")} />
    </div>
  );
}

/* =========================
   Mobile Home Screen
   ========================= */
function MobileHomeScreen({ items, onItemClick, iconRefs }) {
  return (
    <div className="fixed inset-0 z-10 md:hidden pointer-events-auto">
      <div className="h-full w-full px-4 pt-[calc(env(safe-area-inset-top)+52px)] pb-[120px]">
        <div className="mx-auto w-[min(560px,100%)]">
          <div className="grid grid-cols-4 gap-x-4 gap-y-5">
            {items.map((item) => (
              <MobileHomeIcon
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                iconRefs={iconRefs}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileHomeIcon({ item, onClick, iconRefs }) {
  const isMusic = isMusicItem(item);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 active:scale-[0.98] transition"
      aria-label={item.label}
      type="button"
      ref={(el) => {
        if (!iconRefs?.current) return;
        iconRefs.current[item.id] = el;
      }}
    >
      <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/10 shadow-lg grid place-items-center">
        <div className={["relative h-12 w-12 rounded-2xl grid place-items-center", item.iconBg || "bg-white/10"].join(" ")}>
          <div className="h-7 w-7 text-white opacity-95">
            {isMusic ? <Music className="h-full w-full" strokeWidth={1.8} /> : item.icon}
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent opacity-40" />
        </div>
      </div>

      <div className="text-[11px] leading-tight text-white/90 text-center line-clamp-2">{item.label}</div>

      <div className={["h-1 w-1 rounded-full", item.active ? "bg-white/80" : "bg-transparent"].join(" ")} />
    </button>
  );
}

/* =========================
   Mobile Dock Pill
   ========================= */
function MobileDockPill({ items, iconRefs, pinnedCount, onItemClick }) {
  const desired = Math.min(pinnedCount, items.length);
  const pinned = items.slice(0, desired);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="pb-[max(18px,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-[min(560px,calc(100%-24px))]">
          <div className={["rounded-[28px] border border-white/15", "bg-white/12 backdrop-blur-3xl shadow-2xl", "px-3 py-2"].join(" ")}>
            <div
              className="grid justify-items-center items-end gap-2"
              style={{ gridTemplateColumns: `repeat(${pinned.length || 1}, minmax(0, 1fr))` }}
            >
              {pinned.map((item) => (
                <MobileDockIcon
                  key={item.id}
                  item={item}
                  iconRefs={iconRefs}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </div>

            <div className="mt-2 flex justify-center">
              <div className="h-1 w-28 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileDockIcon({ item, iconRefs, onClick }) {
  const isMusic = isMusicItem(item);

  return (
    <div
      className="relative flex flex-col items-center"
      ref={(el) => {
        if (!iconRefs?.current) return;
        iconRefs.current[item.id] = el;
      }}
    >
      <button
        onClick={onClick}
        className={[
          "group relative grid place-items-center",
          "h-14 w-14 rounded-2xl",
          "bg-white/10 border border-white/10 shadow-lg",
          "active:scale-95 transition",
        ].join(" ")}
        aria-label={item.label}
        type="button"
      >
        <div className={["relative h-12 w-12 rounded-2xl grid place-items-center", "shadow-inner shadow-black/20", item.iconBg || "bg-white/10"].join(" ")}>
          <div className="h-7 w-7 text-white opacity-95">
            {isMusic ? <Music className="h-full w-full" strokeWidth={1.8} /> : item.icon}
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent opacity-40" />
        </div>
      </button>

      <div className={["mt-1 h-1 w-1 rounded-full", item.active ? "bg-white/80" : "bg-transparent"].join(" ")} />
    </div>
  );
}

/* =========================
   Music Popup (Dock-owned "MusicApp")
   ========================= */
function MusicPopup({ isMobile, onClose, audioState }) {
  const activeTrack = audioState.tracks?.[audioState.index] || null;

  const safeDur = Number.isFinite(audioState.duration) ? audioState.duration : 0;
  const safeCur = Number.isFinite(audioState.currentTime)
    ? Math.min(audioState.currentTime, safeDur || 0)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        className={[
          "fixed z-[80]",
          isMobile
            ? "left-1/2 -translate-x-1/2 bottom-6 w-[min(560px,calc(100%-24px))]"
            : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(520px,calc(100%-24px))]", // ✅ centered on desktop
        ].join(" ")}
        role="dialog"
        aria-label="Music player"
      >
        <div className="rounded-[24px] border border-white/12 bg-black/35 backdrop-blur-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 border border-white/10">
                <Music className="h-5 w-5 text-white/85" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] text-white/70">Music</div>
                <div className="text-sm text-white/90 font-semibold truncate">
                  {activeTrack?.title || "No tracks added"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/8 hover:bg-white/12"
              aria-label="Close music player"
            >
              <X className="h-4 w-4 text-white/75" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            <div className="text-[12px] text-white/60 truncate">
              {activeTrack?.artist || "Add audio files in /public/audio"}
            </div>

            {audioState.error ? (
              <div className="mt-2 text-[11px] text-rose-300/90 break-words">{audioState.error}</div>
            ) : null}

            {/* Controls */}
            <div className="mt-4 flex items-center justify-center gap-3">
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

            {/* Progress */}
            <div className="mt-4">
              <ProgressBar value={safeCur} max={safeDur} disabled={!safeDur} onSeek={(t) => audioActions.seekTo(t)} />
              <div className="mt-1 flex items-center justify-between text-[11px] text-white/60 tabular-nums">
                <span>{fmtTime(safeCur)}</span>
                <span>{fmtTime(safeDur)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="mt-4">
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
                    onSeek={(v) => audioActions.setVolume(clamp(v, 0, 1))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
