// src/components/IntroGlass.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroGlass({
  title = "Hi, I’m Om Gandhi",
  subtitle = "Welcome to my portfolio",
  durationMs = 20000, // auto-dismiss
}) {
  const [open, setOpen] = useState(true);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }, []);

  useEffect(() => {
    if (!open) return;

    const t = setTimeout(() => setOpen(false), durationMs);

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, durationMs]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.25 }}
          onPointerDown={() => setOpen(false)}
          style={{ touchAction: "manipulation" }}
        >
          {/* Dark veil (subtle) */}
          <div className="absolute inset-0 bg-black/35" />

          {/* Floating background blobs */}
          <motion.div
            className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            animate={
              prefersReducedMotion
                ? {}
                : { x: [0, 22, 0], y: [0, 14, 0], opacity: [0.18, 0.28, 0.18] }
            }
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
            animate={
              prefersReducedMotion
                ? {}
                : { x: [0, -18, 0], y: [0, -12, 0], opacity: [0.16, 0.26, 0.16] }
            }
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Glass card */}
          <motion.div
            className={[
              "relative mx-4 w-[min(520px,92vw)] rounded-3xl",
              "border border-white/15 bg-white/10 backdrop-blur-2xl",
              "shadow-[0_25px_80px_rgba(0,0,0,0.55)]",
              "overflow-hidden",
            ].join(" ")}
            initial={{ y: prefersReducedMotion ? 0 : 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: prefersReducedMotion ? 0 : 10, scale: 0.985, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.35, ease: "easeOut" }}
          >
            {/* Shimmer sweep */}
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.16) 18%, rgba(255,255,255,0.06) 32%, transparent 52%)",
                transform: "translateX(-60%)",
              }}
              animate={prefersReducedMotion ? {} : { transform: ["translateX(-60%)", "translateX(120%)"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Inner content */}
            <div className="relative px-6 py-7 sm:px-8 sm:py-8">
              <div className="flex items-center justify-between">
                {/* macOS-style window dots */}
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]/90" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]/90" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]/90" />
                </div>

                <div className="text-[11px] text-white/55 hidden sm:block">
                  tap/click to continue • Esc to skip
                </div>
              </div>

              <motion.h1
                className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-white"
                animate={prefersReducedMotion ? {} : { y: [0, -2, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              >
                {title}
              </motion.h1>

              <p className="mt-2 text-sm sm:text-base text-white/70">
                {subtitle}
              </p>

              {/* tiny “loading” bar */}
              <div className="mt-6 h-2 w-full rounded-full bg-black/20 border border-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-white/35"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : durationMs / 1000, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
