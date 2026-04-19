// src/components/Dock.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  TerminalSquare,
  Folder,
  FileText,
  Mail,
  Github,
  Linkedin,
  Settings,
  Trash2,
} from "lucide-react";

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

function isTerminalItem(item) {
  if (item?.type) return item.type === "terminal";
  const label = (item?.label || "").toLowerCase();
  return item?.id === "terminal" || label === "terminal";
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
    default:
      return <Folder className={className} strokeWidth={strokeWidth} />;
  }
}

function renderDockIcon(item) {
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

  const handleItemClick = (item) => {
    item?.onClick?.();
  };

  if (isMobile) {
    const mobileItems = items.filter((i) => !isTerminalItem(i));

    return (
      <>
        <MobileHomeScreen
          items={mobileItems}
          onItemClick={handleItemClick}
          iconRefs={iconRefs}
        />

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
    <DesktopDock
      items={items}
      iconRefs={iconRefs}
      onItemClick={handleItemClick}
    />
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
