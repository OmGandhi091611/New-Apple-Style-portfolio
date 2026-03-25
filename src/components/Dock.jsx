// src/components/Dock.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Music,
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Search,
  ListMusic,
  ChevronDown,
  TerminalSquare,
  Folder,
  FileText,
  Mail,
  Github,
  Linkedin,
  Settings,
  Trash2,
} from "lucide-react";

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

function iconFromName(iconName, iconColor = "", strokeWidth = 1.9) {
  const className = `h-full w-full ${iconColor}`.trim();

  switch (iconName) {
    case "terminal":
      return <TerminalSquare className={className} strokeWidth={strokeWidth} />;
    case "folder":
      return <Folder className={className} strokeWidth={strokeWidth} />;
    case "fileText":
      return <FileText className={className} strokeWidth={strokeWidth} />;
    case "mail":
      return <Mail className={className} strokeWidth={strokeWidth} />;
    case "github":
      return <Github className={className} strokeWidth={strokeWidth} />;
    case "linkedin":
      return <Linkedin className={className} strokeWidth={strokeWidth} />;
    case "settings":
      return <Settings className={className} strokeWidth={strokeWidth} />;
    case "trash":
      return <Trash2 className={className} strokeWidth={strokeWidth} />;
    case "music":
      return <Music className={className} strokeWidth={strokeWidth} />;
    default:
      return <Folder className={className} strokeWidth={strokeWidth} />;
  }
}

function renderDockIcon(item) {
  if (isMusicItem(item)) {
    return <Music className="h-full w-full text-white" strokeWidth={1.9} />;
  }

  if (item?.iconName) {
    return iconFromName(item.iconName, item.iconColor);
  }
  if (item?.icon) {
    if (React.isValidElement(item.icon)) {
      const existingClass = item.icon.props?.className || "";
      return React.cloneElement(item.icon, {
        className: `h-full w-full ${existingClass}`.trim(),
      });
    }
    return item.icon;
  }

  if (item?.iconName) {
    return iconFromName(item.iconName, item.iconColor);
  }

  if (isMusicItem(item)) {
    return <Music className="h-full w-full text-white" strokeWidth={1.8} />;
  }

  return null;
}

function iconTileClass(item) {
  return item?.iconBg || "bg-white/10";
}

/**
 * items = [
 *  { id, type?, label, icon, iconName, iconColor, iconBg, onClick, active }
 * ]
 */
export default function Dock({ items = [], iconRefs, pinnedCount = 5 }) {
  const isMobile = useIsMobileMd();
  const [mobileView, setMobileView] = useState("library");
  const [audioState, setAudioState] = useState(() => ({
    tracks: [],
    index: 0,
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.55,
    error: "",
  }));

  const [musicOpen, setMusicOpen] = useState(false);
  const didUnlockRef = useRef(false);

  useEffect(() => {
    audioActions.initTracks(MUSIC_TRACKS);
  }, []);

  useEffect(() => {
    const unsub = subscribeAudio(setAudioState);
    return unsub;
  }, []);

  useEffect(() => {
    if (!musicOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") setMusicOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [musicOpen]);

  const computedItems = useMemo(() => {
    const base = [...items];
    const hasMusic = base.some(isMusicItem);

    if (!hasMusic) {
      base.splice(Math.min(base.length, pinnedCount), 0, {
        id: "music",
        type: "music",
        label: "Music",
        iconName: "music",
        iconColor: "text-white",
        iconBg: "bg-gradient-to-br from-pink-500/80 to-purple-600/80",
        onClick: () => {},
        active: false,
      });
    }

    return base.map((item) =>
      isMusicItem(item)
        ? {
            ...item,
            active: musicOpen,
            iconName: item.iconName || "music",
            iconColor: item.iconColor || "text-white",
            iconBg:
              item.iconBg || "bg-gradient-to-br from-pink-500/80 to-purple-600/80",
          }
        : item
    );
  }, [items, pinnedCount, musicOpen]);

  const handleItemClick = (item) => {
    if (isMusicItem(item)) {
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

  if (isMobile) {
    const mobileItems = computedItems.filter((i) => !isTerminalItem(i));

    return (
      <>
        <MobileHomeScreen
          items={mobileItems}
          onItemClick={handleItemClick}
          iconRefs={iconRefs}
        />

        {musicOpen && (
          <MusicPopup
            isMobile
            onClose={() => setMusicOpen(false)}
            audioState={audioState}
          />
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

  return (
    <>
      {musicOpen && (
        <MusicPopup
          isMobile={false}
          onClose={() => setMusicOpen(false)}
          audioState={audioState}
        />
      )}

      <DesktopDock
        items={computedItems}
        iconRefs={iconRefs}
        onItemClick={handleItemClick}
      />
    </>
  );
}

function DesktopDock({ items = [], iconRefs, onItemClick }) {
  const [hoveredId, setHoveredId] = useState(null);

  const hoveredIndex = useMemo(() => {
    if (!hoveredId) return -1;
    return items.findIndex((i) => i.id === hoveredId);
  }, [hoveredId, items]);

  return (
    <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-50 flex justify-center">
      <div
        className="pointer-events-auto relative rounded-3xl border border-white/15 bg-white/10 px-3 py-2 shadow-2xl backdrop-blur-2xl"
        onMouseLeave={() => setHoveredId(null)}
      >
        <div className="flex items-end gap-2">
          {items.map((item, idx) => {
            const distance =
              hoveredIndex === -1 ? 999 : Math.abs(idx - hoveredIndex);
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
          "pointer-events-none absolute -top-10 rounded-md border border-white/15 bg-black/60 px-2 py-1 text-[11px] text-white/90 shadow-lg backdrop-blur-xl transition-all duration-150",
          hovered ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        ].join(" ")}
      >
        {item.label}
      </div>

      <button
        onClick={onClick}
        className="group relative grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10 shadow-lg transition-transform duration-150 ease-out hover:bg-white/15 active:scale-95"
        style={{ transform: `scale(${scale})` }}
        aria-label={item.label}
        type="button"
      >
        <div
          className={`relative grid h-12 w-12 place-items-center rounded-2xl shadow-inner shadow-black/20 ${iconTileClass(
            item
          )}`}
        >
          <div className="h-7 w-7 opacity-95">{renderDockIcon(item)}</div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent opacity-40" />
        </div>
      </button>

      <div
        className={[
          "mt-1 h-1 w-1 rounded-full",
          item.active ? "bg-white/80" : "bg-transparent",
        ].join(" ")}
      />
    </div>
  );
}

function MobileHomeScreen({ items = [], onItemClick, iconRefs }) {
  const gridItems = items.slice(0, 12);

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),rgba(0,0,0,0.15)_35%,rgba(0,0,0,0.55)_100%)]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a3550] via-[#1f2435] to-[#12141b]" />

      <div className="relative z-10 flex h-full flex-col px-5 pb-28 pt-8">
        <div className="mb-6 text-center">
          <div className="text-[13px] font-medium text-white/75">Portfolio</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-white">
            Om&apos;s Desktop
          </div>
        </div>

        <div className="grid grid-cols-4 gap-x-4 gap-y-6">
          {gridItems.map((item) => (
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
  );
}

function MobileHomeIcon({ item, onClick, iconRefs }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 transition active:scale-[0.98]"
      aria-label={item.label}
      type="button"
      ref={(el) => {
        if (!iconRefs?.current) return;
        iconRefs.current[item.id] = el;
      }}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10 shadow-lg">
        <div
          className={`relative grid h-12 w-12 place-items-center rounded-2xl ${iconTileClass(
            item
          )}`}
        >
          <div className="h-7 w-7 opacity-95">{renderDockIcon(item)}</div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent opacity-40" />
        </div>
      </div>

      <div className="line-clamp-2 text-center text-[11px] leading-tight text-white/90">
        {item.label}
      </div>

      <div
        className={[
          "h-1 w-1 rounded-full",
          item.active ? "bg-white/80" : "bg-transparent",
        ].join(" ")}
      />
    </button>
  );
}

function MobileDockPill({ items = [], iconRefs, pinnedCount = 5, onItemClick }) {
  const dockItems = items.slice(0, pinnedCount);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-center gap-3 rounded-[28px] border border-white/15 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-2xl">
        {dockItems.map((item) => (
          <MobileDockIcon
            key={item.id}
            item={item}
            iconRefs={iconRefs}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>
    </div>
  );
}

function MobileDockIcon({ item, iconRefs, onClick }) {
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
        className="group relative grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10 shadow-lg transition active:scale-95"
        aria-label={item.label}
        type="button"
      >
        <div
          className={`relative grid h-12 w-12 place-items-center rounded-2xl shadow-inner shadow-black/20 ${iconTileClass(
            item
          )}`}
        >
          <div className="h-7 w-7 opacity-95">{renderDockIcon(item)}</div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent opacity-40" />
        </div>
      </button>

      <div
        className={[
          "mt-1 h-1 w-1 rounded-full",
          item.active ? "bg-white/80" : "bg-transparent",
        ].join(" ")}
      />
    </div>
  );
}

function MusicPopup({ isMobile, onClose, audioState }) {
  const activeTrack = audioState.tracks?.[audioState.index] || null;
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState("library");

  const safeDur = Number.isFinite(audioState.duration) ? audioState.duration : 0;
  const safeCur = Number.isFinite(audioState.currentTime)
    ? Math.min(audioState.currentTime, safeDur || 0)
    : 0;

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return audioState.tracks || [];

    return (audioState.tracks || []).filter((track) => {
      const hay = `${track?.title || ""} ${track?.artist || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [audioState.tracks, query]);

  const handleSelectTrack = (track) => {
    const originalIndex = audioState.tracks.findIndex(
      (t) =>
        t?.src === track?.src &&
        t?.title === track?.title &&
        t?.artist === track?.artist
    );

    if (originalIndex >= 0) {
      audioActions.setTrack(originalIndex, { autoplay: true });
      if (isMobile) setMobileView("player");
    }
  };

  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 z-[70] bg-black/55"
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          className="fixed inset-0 z-[80] bg-[#0b0c10]/95 backdrop-blur-3xl"
          role="dialog"
          aria-label="Music player"
        >
          {mobileView === "library" ? (
            <MobileMusicLibraryView
              onClose={onClose}
              query={query}
              setQuery={setQuery}
              filteredTracks={filteredTracks}
              audioState={audioState}
              onSelectTrack={handleSelectTrack}
              onOpenPlayer={() => setMobileView("player")}
              safeCur={safeCur}
              safeDur={safeDur}
            />
          ) : (
            <MobileNowPlayingView
              onBack={() => setMobileView("library")}
              activeTrack={activeTrack}
              audioState={audioState}
              safeCur={safeCur}
              safeDur={safeDur}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="fixed left-1/2 top-1/2 z-[80] w-[min(860px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-label="Music player"
      >
        <div className="overflow-hidden rounded-[24px] border border-white/12 bg-black/35 shadow-2xl backdrop-blur-3xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10">
                <Music className="h-5 w-5 text-white/85" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] text-white/65">Music</div>
                <div className="truncate text-sm font-semibold text-white/92">
                  Library
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/8 transition hover:bg-white/12"
              aria-label="Close music player"
            >
              <X className="h-4 w-4 text-white/75" />
            </button>
          </div>

          <div className="grid min-h-[540px] grid-cols-[290px_minmax(0,1fr)]">
            <div className="border-r border-white/10 bg-white/5">
              <div className="border-b border-white/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/50">
                  <ListMusic className="h-3.5 w-3.5" />
                  Songs
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search songs"
                    className="w-full rounded-xl border border-white/10 bg-white/8 py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20 focus:bg-white/10"
                  />
                </div>

                <div className="mt-3 text-[11px] text-white/45">
                  {filteredTracks.length} song{filteredTracks.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="max-h-[430px] overflow-y-auto p-2">
                {filteredTracks.length ? (
                  filteredTracks.map((track, idx) => {
                    const actualIndex = audioState.tracks.findIndex(
                      (t) =>
                        t?.src === track?.src &&
                        t?.title === track?.title &&
                        t?.artist === track?.artist
                    );

                    const active = actualIndex === audioState.index;

                    return (
                      <button
                        key={`${track.title}-${track.artist}-${idx}`}
                        type="button"
                        onClick={() => handleSelectTrack(track)}
                        className={[
                          "mb-2 w-full rounded-2xl border px-3 py-3 text-left transition",
                          active
                            ? "border-white/20 bg-white/14"
                            : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/8",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-pink-500/60 to-purple-600/70 text-white">
                            <Music className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-white/90">
                              {track.title || "Untitled"}
                            </div>
                            <div className="truncate text-xs text-white/55">
                              {track.artist || "Unknown artist"}
                            </div>
                          </div>

                          {active && (
                            <div className="ml-2 shrink-0 rounded-full border border-emerald-300/25 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                              Playing
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-6 text-sm text-white/50">
                    No songs match your search.
                  </div>
                )}
              </div>
            </div>

            <DesktopNowPlayingPanel
              activeTrack={activeTrack}
              audioState={audioState}
              safeCur={safeCur}
              safeDur={safeDur}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function MobileMusicLibraryView({
  onClose,
  query,
  setQuery,
  filteredTracks,
  audioState,
  onSelectTrack,
  onOpenPlayer,
  safeCur,
  safeDur,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            Music
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">Library</div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/8"
          aria-label="Close music"
        >
          <X className="h-5 w-5 text-white/75" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs"
            className="w-full rounded-2xl border border-white/10 bg-white/8 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20 focus:bg-white/10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <div className="mb-3 text-[11px] text-white/45">
          {filteredTracks.length} song{filteredTracks.length === 1 ? "" : "s"}
        </div>

        <div className="space-y-2">
          {filteredTracks.length ? (
            filteredTracks.map((track, idx) => {
              const actualIndex = audioState.tracks.findIndex(
                (t) =>
                  t?.src === track?.src &&
                  t?.title === track?.title &&
                  t?.artist === track?.artist
              );

              const active = actualIndex === audioState.index;

              return (
                <button
                  key={`${track.title}-${track.artist}-${idx}`}
                  type="button"
                  onClick={() => onSelectTrack(track)}
                  className={[
                    "w-full rounded-2xl border px-3 py-3 text-left transition",
                    active
                      ? "border-white/20 bg-white/14"
                      : "border-transparent bg-white/[0.04] hover:border-white/10 hover:bg-white/8",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-pink-500/60 to-purple-600/70 text-white">
                      <Music className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white/92">
                        {track.title || "Untitled"}
                      </div>
                      <div className="truncate text-xs text-white/55">
                        {track.artist || "Unknown artist"}
                      </div>
                    </div>

                    {active && (
                      <div className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                        Playing
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4 text-sm text-white/50">
              No songs match your search.
            </div>
          )}
        </div>
      </div>

      {audioState.tracks?.length ? (
        <MobileMiniPlayer
          audioState={audioState}
          safeCur={safeCur}
          safeDur={safeDur}
          onOpenPlayer={onOpenPlayer}
        />
      ) : null}
    </div>
  );
}

function MobileMiniPlayer({
  audioState,
  safeCur,
  safeDur,
  onOpenPlayer,
}) {
  const activeTrack = audioState.tracks?.[audioState.index] || null;
  const pct = safeDur > 0 ? clamp(safeCur / safeDur, 0, 1) : 0;

  return (
    <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#121318]/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl">
      <div className="w-full rounded-2xl border border-white/10 bg-white/[0.06]">
        <div
          role="button"
          tabIndex={0}
          onClick={onOpenPlayer}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenPlayer();
            }
          }}
          className="cursor-pointer px-3 py-3"
        >
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white/70"
              style={{ width: `${pct * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-pink-500/60 to-purple-600/70 text-white">
              <Music className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white/92">
                {activeTrack?.title || "Nothing playing"}
              </div>
              <div className="truncate text-xs text-white/55">
                {activeTrack?.artist || "Choose a song"}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                audioActions.togglePlay();
              }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/8"
              aria-label="Play/Pause"
            >
              {audioState.playing ? (
                <Pause className="h-4 w-4 text-white/90" />
              ) : (
                <Play className="h-4 w-4 text-white/90" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileNowPlayingView({
  onBack,
  activeTrack,
  audioState,
  safeCur,
  safeDur,
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/85"
        >
          Back
        </button>

        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Now Playing
          </div>
        </div>

        <div className="w-[68px]" />
      </div>

      <div className="mt-8 flex flex-col items-center text-center">
        <div className="grid h-56 w-56 max-w-[78vw] max-h-[78vw] place-items-center rounded-[32px] border border-white/10 bg-gradient-to-br from-pink-500/25 via-fuchsia-500/15 to-purple-700/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Music className="h-20 w-20 text-white/80" />
        </div>

        <div className="mt-6 max-w-full">
          <div className="truncate text-2xl font-semibold text-white/96">
            {activeTrack?.title || "No track selected"}
          </div>
          <div className="mt-2 truncate text-base text-white/60">
            {activeTrack?.artist || "Unknown artist"}
          </div>
        </div>
      </div>

      {audioState.error ? (
        <div className="mt-5 break-words rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-[11px] text-rose-200/90">
          {audioState.error}
        </div>
      ) : null}

      <div className="mt-8">
        <ProgressBar
          value={safeCur}
          max={safeDur}
          disabled={!safeDur}
          onSeek={(t) => audioActions.seekTo(t)}
        />
        <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-white/60">
          <span>{fmtTime(safeCur)}</span>
          <span>{fmtTime(safeDur)}</span>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={audioActions.prev}
          disabled={!audioState.tracks.length}
          className={[
            "grid h-12 w-12 place-items-center rounded-full border border-white/10 transition",
            audioState.tracks.length
              ? "bg-white/8 text-white/90"
              : "bg-white/5 opacity-60",
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
            "grid h-16 w-16 place-items-center rounded-full border border-white/10 transition",
            audioState.tracks.length
              ? "bg-white/14 text-white/95"
              : "bg-white/5 opacity-60",
          ].join(" ")}
          aria-label="Play/Pause"
        >
          {audioState.playing ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </button>

        <button
          type="button"
          onClick={audioActions.next}
          disabled={!audioState.tracks.length}
          className={[
            "grid h-12 w-12 place-items-center rounded-full border border-white/10 transition",
            audioState.tracks.length
              ? "bg-white/8 text-white/90"
              : "bg-white/5 opacity-60",
          ].join(" ")}
          aria-label="Next"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between text-[11px] text-white/60">
          <span>Volume</span>
          <span className="tabular-nums">
            {Math.round((audioState.volume || 0) * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-3">
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
  );
}

function DesktopNowPlayingPanel({ activeTrack, audioState, safeCur, safeDur }) {
  return (
    <div className="p-6">
      <div className="flex h-full flex-col">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-40 w-40 place-items-center rounded-[28px] border border-white/10 bg-gradient-to-br from-pink-500/25 via-fuchsia-500/15 to-purple-700/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Music className="h-16 w-16 text-white/80" />
          </div>

          <div className="mt-5 max-w-full">
            <div className="truncate text-xl font-semibold text-white/95">
              {activeTrack?.title || "No track selected"}
            </div>
            <div className="mt-1 truncate text-sm text-white/60">
              {activeTrack?.artist || "Add audio files in /public/audio"}
            </div>
          </div>

          <div className="mt-3 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] text-white/55">
            {audioState.tracks?.length ? audioState.index + 1 : 0} of{" "}
            {audioState.tracks?.length || 0}
          </div>
        </div>

        {audioState.error ? (
          <div className="mt-4 break-words rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-[11px] text-rose-200/90">
            {audioState.error}
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={audioActions.prev}
            disabled={!audioState.tracks.length}
            className={[
              "grid h-11 w-11 place-items-center rounded-xl border border-white/10 transition",
              audioState.tracks.length
                ? "bg-black/25 text-white/85 hover:bg-white/10"
                : "bg-white/5 opacity-60",
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
              "grid h-14 w-14 place-items-center rounded-2xl border border-white/10 transition",
              audioState.tracks.length
                ? "bg-white/12 text-white/92 hover:bg-white/16"
                : "bg-white/5 opacity-60",
            ].join(" ")}
            aria-label="Play/Pause"
          >
            {audioState.playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={audioActions.next}
            disabled={!audioState.tracks.length}
            className={[
              "grid h-11 w-11 place-items-center rounded-xl border border-white/10 transition",
              audioState.tracks.length
                ? "bg-black/25 text-white/85 hover:bg-white/10"
                : "bg-white/5 opacity-60",
            ].join(" ")}
            aria-label="Next"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-7">
          <ProgressBar
            value={safeCur}
            max={safeDur}
            disabled={!safeDur}
            onSeek={(t) => audioActions.seekTo(t)}
          />
          <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-white/60">
            <span>{fmtTime(safeCur)}</span>
            <span>{fmtTime(safeDur)}</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>Volume</span>
            <span className="tabular-nums">
              {Math.round((audioState.volume || 0) * 100)}%
            </span>
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

        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
              Now Playing
            </div>
            <div className="mt-2 truncate text-sm text-white/85">
              {activeTrack?.title || "Nothing playing"}
            </div>
            <div className="mt-1 truncate text-xs text-white/50">
              {activeTrack?.artist || "Choose a track from the library"}
            </div>
          </div>
        </div>
      </div>
    </div>
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
        "relative h-2.5 w-full select-none overflow-hidden rounded-full border border-white/12",
        disabled ? "bg-white/6" : "cursor-pointer bg-white/8",
      ].join(" ")}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-white/70"
        style={{ width: `${pct * 100}%` }}
      />
      {!disabled && (
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-white/20 bg-white shadow"
          style={{ left: `calc(${pct * 100}% - 7px)` }}
        />
      )}
    </div>
  );
}