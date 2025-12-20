// src/components/DesktopWifiMenu.jsx
import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

export default function DesktopWifiMenu({
  open,
  anchorRect, // getBoundingClientRect() of wifi button
  onRequestClose,
  enabled = true,
  onToggleEnabled,
  networks = [],
  connectedSsid = "",
  onSelectNetwork,
}) {
  const style = useMemo(() => {
    const gap = 10;
    if (!anchorRect) return { top: 56 + gap, right: 24 };

    const top = Math.round(anchorRect.bottom + gap);
    const right = Math.max(12, Math.round(window.innerWidth - anchorRect.right));
    return { top, right };
  }, [anchorRect]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onRequestClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onRequestClose]);

  const sorted = useMemo(() => {
    const list = Array.isArray(networks) ? networks.slice() : [];
    // Put connected first, then strongest
    list.sort((a, b) => {
      const aConn = a.ssid === connectedSsid ? 1 : 0;
      const bConn = b.ssid === connectedSsid ? 1 : 0;
      if (aConn !== bConn) return bConn - aConn;
      return (b.rssi ?? 0) - (a.rssi ?? 0);
    });
    return list;
  }, [networks, connectedSsid]);

  return (
    <>
      {/* Click-outside backdrop */}
      <div
        className={[
          "fixed inset-0 z-[219]",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        onMouseDown={onRequestClose}
      />

      <motion.div
        initial={false}
        animate={
          open
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.985, y: -8 }
        }
        transition={{ type: "spring", stiffness: 520, damping: 44 }}
        style={style}
        className={[
          "fixed z-[220] origin-top-right",
          "w-[320px] max-w-[92vw]",
          "rounded-[18px]",
          "border border-white/12",
          "bg-zinc-950/80",
          "backdrop-blur-3xl backdrop-saturate-150",
          "shadow-[0_20px_70px_rgba(0,0,0,0.55)]",
          "p-2",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
        role="menu"
        aria-label="Wi-Fi"
      >
        {/* Header */}
        <div className="px-2 pt-2 pb-1 flex items-center justify-between">
          <div className="text-[13px] font-semibold text-white/90">Wi-Fi</div>

          {/* macOS-like toggle */}
          <button
            type="button"
            onClick={onToggleEnabled}
            className={[
              "h-7 w-12 rounded-full border border-white/12 transition relative",
              enabled ? "bg-blue-500/90" : "bg-white/10",
            ].join(" ")}
            aria-pressed={enabled}
            aria-label="Toggle Wi-Fi"
          >
            <span
              className={[
                "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white",
                "transition-transform",
                enabled ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        <div className="h-px bg-white/10 my-1" />

        {/* Networks */}
        <div className="px-1 py-1">
          {!enabled ? (
            <div className="px-2 py-2 text-[12px] text-white/55">
              Wi-Fi is turned off.
            </div>
          ) : sorted.length === 0 ? (
            <div className="px-2 py-2 text-[12px] text-white/55">
              No networks found.
            </div>
          ) : (
            <div className="max-h-[260px] overflow-auto">
              {sorted.map((n) => {
                const connected = n.ssid === connectedSsid;
                return (
                  <button
                    key={n.ssid}
                    type="button"
                    onClick={() => onSelectNetwork?.(n)}
                    className={[
                      "w-full flex items-center gap-2",
                      "rounded-[12px] px-2 py-2",
                      "hover:bg-white/10 transition text-left",
                    ].join(" ")}
                    role="menuitem"
                  >
                    <div className="w-5 grid place-items-center text-white/80">
                      {connected ? <Check className="h-4 w-4" /> : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-white/90 truncate">
                        {n.ssid}
                      </div>
                      {connected ? (
                        <div className="text-[11px] text-white/55">Connected</div>
                      ) : null}
                    </div>

                    {n.secure ? (
                      <Lock className="h-4 w-4 text-white/40" />
                    ) : (
                      <span className="w-4" />
                    )}

                    <WifiBars rssi={n.rssi} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-px bg-white/10 my-1" />

        {/* Footer actions */}
        <div className="px-1 pb-1">
          <MenuRow label="Other Networks…" onClick={() => {}} />
          <MenuRow label="Wi-Fi Settings…" onClick={() => {}} />
        </div>
      </motion.div>
    </>
  );
}

function MenuRow({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[12px] px-3 py-2 text-[13px] text-white/80 hover:bg-white/10 transition text-left"
    >
      {label}
    </button>
  );
}

// Simple “signal bars” (mac-ish). rssi expected around -30 (great) to -90 (bad).
function WifiBars({ rssi = -60 }) {
  const level = rssiToLevel(rssi); // 0..3
  return (
    <div className="flex items-end gap-[2px] w-[22px] justify-end">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={[
            "block w-[3px] rounded-sm",
            i <= level ? "bg-white/80" : "bg-white/20",
          ].join(" ")}
          style={{ height: 6 + i * 3 }}
        />
      ))}
    </div>
  );
}

function rssiToLevel(rssi) {
  // -35..-55 => 3, -56..-67 => 2, -68..-80 => 1, else 0
  if (rssi >= -55) return 3;
  if (rssi >= -67) return 2;
  if (rssi >= -80) return 1;
  return 0;
}
