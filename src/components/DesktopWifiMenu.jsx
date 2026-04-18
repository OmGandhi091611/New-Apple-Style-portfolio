// src/components/DesktopWifiMenu.jsx
import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Lock, Check } from "lucide-react";

function rssiToBars(rssi) {
  if (rssi >= -55) return 3;
  if (rssi >= -70) return 2;
  return 1;
}

function WifiBars({ bars, active }) {
  const color = active ? "text-blue-400" : "text-white/50";
  return (
    <span className={`flex items-end gap-[2px] ${color}`}>
      {[1, 2, 3].map((b) => (
        <span
          key={b}
          className={`inline-block w-[3px] rounded-sm ${b <= bars ? "bg-current" : "bg-white/15"}`}
          style={{ height: 4 + b * 3 }}
        />
      ))}
    </span>
  );
}

export default function DesktopWifiMenu({
  open,
  anchorRect,
  onRequestClose,
  enabled,
  onToggleEnabled,
  networks = [],
  connectedSsid,
  onSelectNetwork,
}) {
  const style = useMemo(() => {
    const gap = 10;
    if (!anchorRect) return { top: 56 + gap, left: 120 };
    const top = Math.round(anchorRect.bottom + gap);
    const left = Math.max(12, Math.round(anchorRect.left - 200));
    return { top, left };
  }, [anchorRect]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onRequestClose?.();
    const onDown = (e) => {
      if (!e.target.closest("[data-wifi-menu]")) onRequestClose?.();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open, onRequestClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-wifi-menu
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ position: "fixed", zIndex: 200, width: 260, ...style }}
          className="rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2 text-white/90">
              <Wifi size={15} />
              <span className="text-[13px] font-semibold">Wi-Fi</span>
            </div>
            <button
              type="button"
              onClick={onToggleEnabled}
              className={`w-9 h-5 rounded-full transition-colors duration-200 relative ${
                enabled ? "bg-blue-500" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  enabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Network list */}
          {enabled && networks.length > 0 && (
            <ul className="py-1">
              {networks.map((n) => {
                const connected = n.ssid === connectedSsid;
                const bars = rssiToBars(n.rssi);
                return (
                  <li key={n.ssid}>
                    <button
                      type="button"
                      onClick={() => onSelectNetwork?.(n)}
                      className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-white/8 transition-colors text-left"
                    >
                      <span className="w-4 flex items-center justify-center">
                        {connected && <Check size={12} className="text-blue-400" />}
                      </span>
                      <span className={`flex-1 text-[13px] ${connected ? "text-white font-medium" : "text-white/70"}`}>
                        {n.ssid}
                      </span>
                      {n.secure && <Lock size={10} className="text-white/40" />}
                      <WifiBars bars={bars} active={connected} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!enabled && (
            <div className="flex items-center gap-2 px-4 py-3 text-white/40">
              <WifiOff size={13} />
              <span className="text-[12px]">Wi-Fi is turned off</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
