// src/components/MacWindow.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Minus, X, Square } from "lucide-react";
import { motion } from "framer-motion";

function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpointPx;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();

    // Safari compatibility
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [breakpointPx]);

  return isMobile;
}

export default function MacWindow({
  title = "Window",
  children,
  className = "",

  // window controls
  onClose,
  onMinimize,
  onToggleFullscreen,

  // state (controlled by parent)
  isFullscreen = false,
  isFocused = true,
  isMinimized = false,

  // dock minimize target
  minimizeTargetEl = null,
  minimizeTo = { x: -260, y: 320 },

  onFocus,
  minimizeScale = 0.12,
  fullscreenOnly = false,
}) {
  const isMobile = useIsMobile(640);
  const winRef = useRef(null);

  const effectiveFullscreen = fullscreenOnly ? true : isFullscreen;

  const lastRestRectRef = useRef(null);
  const frozenTargetRectRef = useRef(null);

  const [minDelta, setMinDelta] = useState(minimizeTo);

  // Track window rect any time it is NOT minimized
  useLayoutEffect(() => {
    if (isMinimized) return;
    const el = winRef.current;
    if (!el) return;
    lastRestRectRef.current = el.getBoundingClientRect();
  }, [isMinimized, effectiveFullscreen, className]);

  // When minimize starts, compute a ONE-TIME vector to the dock icon center
  useLayoutEffect(() => {
    if (!isMinimized) {
      frozenTargetRectRef.current = null;
      return;
    }

    const el = winRef.current;
    if (!el) return;

    const winRect = lastRestRectRef.current || el.getBoundingClientRect();

    if (!frozenTargetRectRef.current && minimizeTargetEl?.getBoundingClientRect) {
      frozenTargetRectRef.current = minimizeTargetEl.getBoundingClientRect();
    }

    const targetRect = frozenTargetRectRef.current;

    if (!targetRect) {
      setMinDelta((prev) => {
        const next = { x: minimizeTo.x, y: minimizeTo.y };
        return prev.x === next.x && prev.y === next.y ? prev : next;
      });
      return;
    }

    const originX = winRect.left + 34;
    const originY = winRect.top + 20;

    const tgtX = targetRect.left + targetRect.width / 2;
    const tgtY = targetRect.top + targetRect.height / 2;

    const next = { x: tgtX - originX, y: tgtY - originY };
    setMinDelta((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
  }, [isMinimized, minimizeTargetEl, minimizeTo.x, minimizeTo.y]);

  const animateState = isMinimized
    ? "minimized"
    : effectiveFullscreen
      ? "fullscreen"
      : "normal";

  const variants = useMemo(
    () => ({
      normal: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: { type: "spring", stiffness: 420, damping: 34 },
      },
      fullscreen: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: { type: "spring", stiffness: 420, damping: 34 },
      },
      minimized: {
        opacity: 0,
        scale: minimizeScale,
        x: minDelta.x,
        y: minDelta.y,
        transition: { type: "spring", stiffness: 560, damping: 44 },
      },
    }),
    [minDelta.x, minDelta.y, minimizeScale]
  );

  const fullscreenDisabled = fullscreenOnly || !onToggleFullscreen;

  // On mobile (or fullscreen), behave like a modal on top of everything
  const useFixed = isMobile || effectiveFullscreen;

  const showBackdrop = useFixed && isFocused && !isMinimized;

  const positionClass = useFixed ? "fixed" : "absolute";

  const layoutClass = effectiveFullscreen
    ? (isMobile ? "inset-2" : "inset-4") + " w-auto h-auto"
    : [
        // mobile: near-full window with room for dock
        "left-2 right-2 top-16 bottom-24",
        // desktop+
        "sm:left-16 sm:top-20 sm:right-auto sm:bottom-auto sm:w-[720px] sm:h-[420px]",
      ].join(" ");

  // Make mobile window less transparent so it doesn't look “inside the icons”
  const windowBgClass = isMobile ? "bg-black/45 backdrop-blur-2xl" : "bg-white/10 backdrop-blur-2xl";
  const titlebarBgClass = isMobile ? "bg-black/35" : "bg-white/5";

  return (
    <>
      {showBackdrop && (
        <div
          className="fixed inset-0 z-[190] bg-black/30 backdrop-blur-sm"
          onPointerDown={(e) => {
            e.stopPropagation();
            onFocus?.();
          }}
        />
      )}

      <motion.div
        ref={winRef}
        initial={false}
        animate={animateState}
        variants={variants}
        style={{
          transformOrigin: "left top",
          pointerEvents: isMinimized ? "none" : "auto",
          willChange: "transform, opacity",
        }}
        aria-hidden={isMinimized ? true : undefined}
        onPointerDown={(e) => {
          e.stopPropagation();
          onFocus?.();
        }}
        className={[
          positionClass,
          // make sure it’s ABOVE app icons/dock
          "z-[200]",
          "rounded-2xl border border-white/15",
          windowBgClass,
          "shadow-2xl overflow-hidden flex flex-col",
          isFocused ? "ring-1 ring-white/10" : "opacity-90",
          layoutClass,
          className,
        ].join(" ")}
      >
        {/* Title bar */}
        <div className={["group flex items-center gap-2 px-3 py-2 border-b border-white/10", titlebarBgClass].join(" ")}>
          {/* Close */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="relative h-3 w-3 rounded-full bg-red-500/90"
            aria-label="Close"
            title="Close"
            style={{ touchAction: "manipulation" }}
          >
            <X className="absolute inset-0 m-auto h-2.5 w-2.5 text-black/70 opacity-0 group-hover:opacity-100" />
          </button>

          {/* Minimize */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize?.();
            }}
            className="relative h-3 w-3 rounded-full bg-yellow-400/90"
            aria-label="Minimize"
            title="Minimize"
            style={{ touchAction: "manipulation" }}
          >
            <Minus className="absolute inset-0 m-auto h-2.5 w-2.5 text-black/70 opacity-0 group-hover:opacity-100" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            disabled={fullscreenDisabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!fullscreenDisabled) onToggleFullscreen?.();
            }}
            className={[
              "relative h-3 w-3 rounded-full bg-green-500/90",
              fullscreenDisabled ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
            aria-label="Fullscreen"
            title={fullscreenDisabled ? "Fullscreen locked" : "Fullscreen"}
            style={{ touchAction: "manipulation" }}
          >
            <Square className="absolute inset-0 m-auto h-2.5 w-2.5 text-black/70 opacity-0 group-hover:opacity-100" />
          </button>

          <div className="ml-2 text-sm text-white/80 select-none">{title}</div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3">{children}</div>
      </motion.div>
    </>
  );
}
