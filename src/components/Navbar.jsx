// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { animate, useMotionValue } from "framer-motion";
import { Wifi } from "lucide-react";

import ControlCenter from "./ControlCenter";
import DesktopControlCenter from "./DesktopControlCenter";
import DesktopWifiMenu from "./DesktopWifiMenu";
import { navLinks } from "#constants";

const CLOSED_Y = -560;
const OPEN_Y = 0;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function Navbar() {
  // -----------------------------
  // MOBILE: swipe Control Center
  // -----------------------------
  const [ccOpen, setCcOpen] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false);
  const ccY = useMotionValue(CLOSED_Y);
  const startYRef = useRef(0);
  const lastRef = useRef({ t: 0, y: 0 });

  const openCC = () => {
    setCcOpen(true);
    animate(ccY, OPEN_Y, { type: "spring", stiffness: 520, damping: 44 });
  };

  const closeCC = () => {
    setCcOpen(false);
    animate(ccY, CLOSED_Y, { type: "spring", stiffness: 520, damping: 44 });
  };

  useEffect(() => {
    animate(ccY, ccOpen ? OPEN_Y : CLOSED_Y, {
      type: "spring",
      stiffness: 520,
      damping: 44,
    });
  }, [ccOpen, ccY]);

  const onGestureStart = (e) => {
    if (window.innerWidth >= 768) return;
    setIsGesturing(true);
    if (!ccOpen) setCcOpen(true);

    startYRef.current = e.clientY;
    lastRef.current = { t: performance.now(), y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onGestureMove = (e) => {
    if (!isGesturing) return;
    const dy = e.clientY - startYRef.current;
    const travel = clamp(dy, 0, Math.abs(CLOSED_Y));
    ccY.set(CLOSED_Y + travel);
    lastRef.current = { t: performance.now(), y: e.clientY };
  };

  const onGestureEnd = (e) => {
    if (!isGesturing) return;
    setIsGesturing(false);

    const dy = e.clientY - startYRef.current;
    const now = performance.now();
    const dt = Math.max(1, now - lastRef.current.t);
    const vy = ((e.clientY - lastRef.current.y) / dt) * 1000;

    const shouldOpen = dy > 140 || vy > 700;
    if (shouldOpen) openCC();
    else closeCC();
  };

  // -----------------------------
  // DESKTOP: Control Center popover
  // -----------------------------
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const ccBtnRef = useRef(null);

  const closeDesktop = () => setDesktopOpen(false);

  const openDesktop = () => {
    const el = ccBtnRef.current;
    if (el) setAnchorRect(el.getBoundingClientRect());
    setDesktopOpen(true);
  };

  // -----------------------------
  // DESKTOP: Wi-Fi menu popover
  // -----------------------------
  const [wifiMenuOpen, setWifiMenuOpen] = useState(false);
  const [wifiAnchorRect, setWifiAnchorRect] = useState(null);
  const wifiBtnRef = useRef(null);

  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [connectedSsid, setConnectedSsid] = useState("NETGEAR39-5G");

  const wifiNetworks = [
    { ssid: "NETGEAR39-5G", secure: true, rssi: -45 },
    { ssid: "XFINITY", secure: true, rssi: -62 },
    { ssid: "IIT-Guest", secure: false, rssi: -70 },
    { ssid: "CoffeeShop-WiFi", secure: false, rssi: -78 },
    { ssid: "Neighbor_2.4G", secure: true, rssi: -83 },
  ];

  const closeWifiMenu = () => setWifiMenuOpen(false);

  const openWifiMenu = () => {
    const el = wifiBtnRef.current;
    if (el) setWifiAnchorRect(el.getBoundingClientRect());
    setWifiMenuOpen(true);
  };

  useEffect(() => {
    const anyOpen = desktopOpen || wifiMenuOpen;
    if (!anyOpen) return;

    const update = () => {
      if (desktopOpen && ccBtnRef.current) {
        setAnchorRect(ccBtnRef.current.getBoundingClientRect());
      }
      if (wifiMenuOpen && wifiBtnRef.current) {
        setWifiAnchorRect(wifiBtnRef.current.getBoundingClientRect());
      }
    };

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [desktopOpen, wifiMenuOpen]);

  const toggleWifiMenu = () => {
    if (wifiMenuOpen) closeWifiMenu();
    else {
      closeDesktop();
      openWifiMenu();
    }
  };

  const toggleDesktopCC = () => {
    if (desktopOpen) closeDesktop();
    else {
      closeWifiMenu();
      openDesktop();
    }
  };

  const onSelectNetwork = (n) => {
    setConnectedSsid(n.ssid);
    setWifiMenuOpen(false);
  };

  // -----------------------------
  // NAVBAR -> OPEN FINDER
  // -----------------------------
  const handleNavClick = (link) => {
    const type = link.type;
    const section = link.section;

    window.dispatchEvent(
      new CustomEvent("shell:open", {
        detail: { app: type, section },
      })
    );
  };

  // (Optional) keep time ticking in mobile status bar
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((x) => x + 1), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 relative">
        <div className="flex items-center gap-3">
          <img src="/images/logo.svg" alt="logo" className="h-7 w-7" />
          <p className="font-bold text-white/90">Om&apos;s Portfolio</p>

          <ul className="ml-6 flex items-center gap-4">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => handleNavClick(link)}
                  className="text-sm text-white/70 hover:text-white/90 transition"
                >
                  {link.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side: Wi-Fi + Control Center + Time */}
        <div className="flex items-center gap-4">
          <ul className="flex items-center gap-2">
            <li>
              <button
                ref={wifiBtnRef}
                type="button"
                onClick={toggleWifiMenu}
                className={[
                  "grid place-items-center h-8 w-8 rounded-lg transition",
                  wifiMenuOpen ? "bg-white/12" : "hover:bg-white/8",
                ].join(" ")}
                aria-label="Wi-Fi"
              >
                <Wifi className="h-[18px] w-[18px] text-white/85" strokeWidth={1.6} />
              </button>
            </li>

            <li>
              <button
                ref={ccBtnRef}
                type="button"
                onClick={toggleDesktopCC}
                className={[
                  "grid place-items-center h-8 w-8 rounded-lg transition",
                  desktopOpen ? "bg-white/12" : "hover:bg-white/8",
                ].join(" ")}
                aria-label="Open Control Center"
              >
                <img src="/icons/mode.svg" alt="control-center" className="h-5 w-5 opacity-90" />
              </button>
            </li>
          </ul>

          <time className="text-sm text-white/70 tabular-nums">
            {dayjs().format("ddd MMM D h:mm A")}
          </time>
        </div>
      </nav>

      {/* Desktop Wi-Fi menu popover */}
      <div className="hidden md:block">
        <DesktopWifiMenu
          open={wifiMenuOpen}
          anchorRect={wifiAnchorRect}
          onRequestClose={closeWifiMenu}
          enabled={wifiEnabled}
          onToggleEnabled={() => setWifiEnabled((v) => !v)}
          networks={wifiNetworks}
          connectedSsid={connectedSsid}
          onSelectNetwork={onSelectNetwork}
        />
      </div>

      {/* Desktop Control Center popover */}
      <div className="hidden md:block">
        <DesktopControlCenter open={desktopOpen} anchorRect={anchorRect} onRequestClose={closeDesktop} />
      </div>

      {/* Mobile iPhone-ish status bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[70] px-4 pt-3">
        <div className="flex items-center justify-between text-white/90">
          <div className="text-[13px] font-semibold tabular-nums">{dayjs().format("h:mm")}</div>
          <div className="h-6 w-24 rounded-full bg-black/30 border border-white/10 backdrop-blur-xl" />
          <div className="flex items-center gap-2 text-[12px] opacity-90">
            <span>5G</span>
            <span className="h-2.5 w-4 rounded-sm border border-white/40 relative">
              <span className="absolute right-0 top-0 bottom-0 w-3 bg-white/80 rounded-sm" />
            </span>
          </div>
        </div>

        {/* Swipe zone */}
        <div className="absolute top-0 right-0 h-16 w-32">
          <div
            className="h-full w-full"
            onPointerDown={onGestureStart}
            onPointerMove={onGestureMove}
            onPointerUp={onGestureEnd}
            onPointerCancel={onGestureEnd}
            style={{ touchAction: "none" }}
          />
        </div>
      </div>

      {/* Mobile Control Center overlay */}
      <ControlCenter
        open={ccOpen}
        onClose={closeCC}
        closedY={CLOSED_Y}
        openY={OPEN_Y}
        yExternal={ccY}
      />
    </>
  );
}
