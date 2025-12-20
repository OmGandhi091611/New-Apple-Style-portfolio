// src/components/Dock.jsx
import React, { useEffect, useMemo, useState } from "react";

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

// NEW: decide how many dock slots to show on phones
function useMobileDockSlots() {
  const [slots, setSlots] = useState(4);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;

      // iPhone 14 Plus is 428px CSS width in most device emulations.
      // Treat ~Plus sizes as "large phone" and show 5.
      const largePhone = w >= 420 && w < 768;

      setSlots(largePhone ? 5 : 4);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return slots;
}

function isTerminalItem(item) {
  if (item?.type) return item.type === "terminal";
  const label = (item?.label || "").toLowerCase();
  return item?.id === "terminal" || label === "terminal";
}

/**
 * items = [
 *  { id, type?, label, icon, iconBg, onClick, active }
 * ]
 *
 * Mobile:
 *  - full-screen Home Screen grid (ALWAYS visible)
 *  - dock pill at bottom for pinned apps
 *
 * Desktop:
 *  - existing mac magnification dock
 */
export default function Dock({ items = [], iconRefs, pinnedCount = 5 }) {
  const isMobile = useIsMobileMd();

  if (isMobile) {
    const mobileItems = items.filter((i) => !isTerminalItem(i));
    return (
      <>
        <MobileHomeScreen items={mobileItems} />
        <MobileDockPill
          items={mobileItems}
          iconRefs={iconRefs}
          pinnedCount={pinnedCount}
        />
      </>
    );
  }

  return <DesktopDock items={items} iconRefs={iconRefs} />;
}

/* =========================
   Desktop Dock (your original)
   ========================= */
function DesktopDock({ items = [], iconRefs }) {
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
                iconRefs={iconRefs}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DesktopDockIcon({ item, scale, hovered, onEnter, iconRefs }) {
  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={onEnter}
      ref={(el) => {
        if (!iconRefs?.current) return;
        iconRefs.current[item.id] = el;
      }}
    >
      {/* Tooltip */}
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
        onClick={item.onClick}
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
      >
        <div
          className={[
            "relative h-12 w-12 rounded-2xl grid place-items-center",
            "shadow-inner shadow-black/20",
            item.iconBg || "bg-white/10",
          ].join(" ")}
        >
          <div className="h-7 w-7 text-white opacity-95">{item.icon}</div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent opacity-40" />
        </div>
      </button>

      {/* Active dot */}
      <div
        className={[
          "mt-1 h-1 w-1 rounded-full",
          item.active ? "bg-white/80" : "bg-transparent",
        ].join(" ")}
      />
    </div>
  );
}

/* =========================
   Mobile Home Screen (ALWAYS visible)
   ========================= */
function MobileHomeScreen({ items }) {
  return (
    <div className="fixed inset-0 z-10 md:hidden pointer-events-auto">
      {/* iPhone-ish safe areas: top notch + bottom dock */}
      <div
        className="
          h-full w-full px-4
          pt-[calc(env(safe-area-inset-top)+52px)]
          pb-[120px]
        "
      >
        <div className="mx-auto w-[min(560px,100%)]">
          {/* always 4 columns */}
          <div className="grid grid-cols-4 gap-x-4 gap-y-5">
            {items.map((item) => (
              <MobileHomeIcon key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileHomeIcon({ item }) {
  return (
    <button
      onClick={item.onClick}
      className="flex flex-col items-center gap-2 active:scale-[0.98] transition"
      aria-label={item.label}
    >
      <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/10 shadow-lg grid place-items-center">
        <div
          className={[
            "relative h-12 w-12 rounded-2xl grid place-items-center",
            item.iconBg || "bg-white/10",
          ].join(" ")}
        >
          <div className="h-7 w-7 text-white opacity-95">{item.icon}</div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent opacity-40" />
        </div>
      </div>

      <div className="text-[11px] leading-tight text-white/90 text-center line-clamp-2">
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

/* =========================
   Mobile Dock Pill (pinned apps only)
   ========================= */
function MobileDockPill({ items, iconRefs, pinnedCount }) {
  const slots = useMobileDockSlots(); // 4 (normal) / 5 (plus)

  // cap by slots so plus-size shows one more pinned icon
  const desired = Math.min(pinnedCount, slots, items.length);
  const pinned = items.slice(0, desired);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="pb-[max(18px,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-[min(560px,calc(100%-24px))]">
          <div
            className={[
              "rounded-[28px] border border-white/15",
              "bg-white/12 backdrop-blur-3xl shadow-2xl",
              "px-3 py-2",
            ].join(" ")}
          >
            {/* ✅ iOS-like: evenly spaced icons across the pill */}
            <div
              className="grid justify-items-center items-end gap-2"
              style={{
                gridTemplateColumns: `repeat(${pinned.length || 1}, minmax(0, 1fr))`,
              }}
            >
              {pinned.map((item) => (
                <MobileDockIcon key={item.id} item={item} iconRefs={iconRefs} />
              ))}
            </div>

            {/* Home indicator */}
            <div className="mt-2 flex justify-center">
              <div className="h-1 w-28 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileDockIcon({ item, iconRefs }) {
  return (
    <div
      className="relative flex flex-col items-center"
      ref={(el) => {
        if (!iconRefs?.current) return;
        iconRefs.current[item.id] = el;
      }}
    >
      <button
        onClick={item.onClick}
        className={[
          "group relative grid place-items-center",
          "h-14 w-14 rounded-2xl",
          "bg-white/10 border border-white/10 shadow-lg",
          "active:scale-95 transition",
        ].join(" ")}
        aria-label={item.label}
      >
        <div
          className={[
            "relative h-12 w-12 rounded-2xl grid place-items-center",
            "shadow-inner shadow-black/20",
            item.iconBg || "bg-white/10",
          ].join(" ")}
        >
          <div className="h-7 w-7 text-white opacity-95">{item.icon}</div>
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
