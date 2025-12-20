// src/components/DesktopShell.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Dock from "./Dock";
import MacWindow from "./MacWindow";
import TerminalXterm from "./TerminalXterm";

import FinderApp from "./FinderApp";
import NotesApp from "./NotesApp";
import Contact from "./Contact";

import { TERMINAL_PROFILE, DOCK_APPS, SOCIAL_LINKS } from "#constants";
import { Terminal, Folder, StickyNote, FileText, Mail, Github, Linkedin } from "lucide-react";

const ICONS = {
  terminal: Terminal,
  finder: Folder,
  about: StickyNote,
  resume: FileText,
  contact: Mail,
  github: Github,
  linkedin: Linkedin,
};

const initWin = () => ({ open: false, minimized: false, fullscreen: false });

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

export default function DesktopShell() {
  const isMobile = useIsMobileMd();

  const [terminal, setTerminal] = useState(initWin);
  const [finder, setFinder] = useState(initWin);
  const [about, setAbout] = useState(initWin);
  const [contact, setContact] = useState(initWin);

  const [focused, setFocused] = useState(null);

  const dockIconRefs = useRef({});

  const dockIdByType = useMemo(() => {
    const map = {};
    for (const a of DOCK_APPS) map[a.type] = a.id;
    return map;
  }, []);

  const dockElForType = (type) => {
    const dockId = dockIdByType[type];
    return dockId ? dockIconRefs.current[dockId] : null;
  };

  const closeWin = (setFn, key) => {
    if (focused === key) setFocused(null);
    setFn((w) => ({ ...w, open: false, minimized: false, fullscreen: false }));
  };

  const minimizeWin = (setFn, key) => {
    if (focused === key) setFocused(null);
    setFn((w) => ({ ...w, minimized: true, fullscreen: false }));
  };

  const toggleFullscreen = (setFn, key) => {
    setFocused(key);
    setFn((w) => ({ ...w, fullscreen: !w.fullscreen, minimized: false }));
  };

  // Dock click: closed => open, minimized => restore, open => minimize
  const dockToggle = (type) => {
    const openOrRestoreLocal = (setFn, key) => {
      setFocused(key);
      setFn((w) => ({ ...w, open: true, minimized: false }));
    };

    switch (type) {
      case "terminal":
        return () => {
          if (!terminal.open) return openOrRestoreLocal(setTerminal, "terminal");
          if (terminal.minimized) return openOrRestoreLocal(setTerminal, "terminal");
          return minimizeWin(setTerminal, "terminal");
        };
      case "finder":
        return () => {
          if (!finder.open) return openOrRestoreLocal(setFinder, "finder");
          if (finder.minimized) return openOrRestoreLocal(setFinder, "finder");
          return minimizeWin(setFinder, "finder");
        };
      case "about":
        return () => {
          if (!about.open) return openOrRestoreLocal(setAbout, "about");
          if (about.minimized) return openOrRestoreLocal(setAbout, "about");
          return minimizeWin(setAbout, "about");
        };
      case "contact":
        return () => {
          if (!contact.open) return openOrRestoreLocal(setContact, "contact");
          if (contact.minimized) return openOrRestoreLocal(setContact, "contact");
          return minimizeWin(setContact, "contact");
        };
      case "resume":
        return () => window.open(TERMINAL_PROFILE.resumeUrl, "_blank", "noopener,noreferrer");
      default:
        return () => {};
    }
  };

  // ✅ Navbar -> DesktopShell open apps
  useEffect(() => {
    const onShellOpen = (e) => {
      const { app, section } = e.detail || {};
      if (!app) return;

      const openOrRestore = (setFn, key) => {
        setFocused(key);
        setFn((w) => ({ ...w, open: true, minimized: false }));
      };

      if (app === "resume") {
        window.open(TERMINAL_PROFILE.resumeUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (app === "finder") {
        openOrRestore(setFinder, "finder");

        // tell Finder what to show
        window.dispatchEvent(
          new CustomEvent("finder:navigate", {
            detail: { section: section || "root" },
          })
        );
        return;
      }

      if (app === "about") {
        openOrRestore(setAbout, "about");
        return;
      }

      if (app === "contact") {
        openOrRestore(setContact, "contact");
        return;
      }
    };

    window.addEventListener("shell:open", onShellOpen);
    return () => window.removeEventListener("shell:open", onShellOpen);
  }, []);

  const dockItems = useMemo(() => {
    const getState = (type) => {
      switch (type) {
        case "terminal":
          return terminal;
        case "finder":
          return finder;
        case "about":
          return about;
        case "contact":
          return contact;
        default:
          return { open: false, minimized: false, fullscreen: false };
      }
    };

    const baseApps = DOCK_APPS.map((app) => {
      const Icon = ICONS[app.type] || Terminal;
      const st = getState(app.type);

      return {
        id: app.id,
        type: app.type,
        label: app.label,
        icon: <Icon className="h-full w-full" strokeWidth={1.8} />,
        iconBg: app.iconBg,
        onClick: dockToggle(app.type),
        active: app.type === "resume" ? false : st.open,
      };
    });

    const extras = [
      {
        id: "github",
        type: "github",
        label: "GitHub",
        icon: <Github className="h-full w-full" strokeWidth={1.8} />,
        iconBg: "bg-zinc-800/90",
        onClick: () => window.open(SOCIAL_LINKS.github, "_blank", "noopener,noreferrer"),
        active: false,
      },
      {
        id: "linkedin",
        type: "linkedin",
        label: "LinkedIn",
        icon: <Linkedin className="h-full w-full" strokeWidth={1.8} />,
        iconBg: "bg-blue-600/90",
        onClick: () => window.open(SOCIAL_LINKS.linkedin, "_blank", "noopener,noreferrer"),
        active: false,
      },
    ];

    const all = [...baseApps, ...extras];
    return isMobile ? all.filter((i) => i.type !== "terminal") : all;
  }, [terminal, finder, about, contact, isMobile]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {!isMobile && terminal.open && (
        <MacWindow
          title="Terminal"
          isFullscreen={terminal.fullscreen}
          isMinimized={terminal.minimized}
          isFocused={focused === "terminal"}
          onFocus={() => setFocused("terminal")}
          className={focused === "terminal" ? "z-50" : "z-40"}
          minimizeTargetEl={dockElForType("terminal")}
          onClose={() => closeWin(setTerminal, "terminal")}
          onMinimize={() => minimizeWin(setTerminal, "terminal")}
          onToggleFullscreen={() => toggleFullscreen(setTerminal, "terminal")}
        >
          <TerminalXterm
            onOpenProjects={() => {
              setFocused("finder");
              setFinder((w) => ({ ...w, open: true, minimized: false }));
            }}
            onOpenAbout={() => {
              setFocused("about");
              setAbout((w) => ({ ...w, open: true, minimized: false }));
            }}
            onOpenContact={() => {
              setFocused("contact");
              setContact((w) => ({ ...w, open: true, minimized: false }));
            }}
          />
        </MacWindow>
      )}

      {finder.open && (
        <MacWindow
          title="Finder"
          isFullscreen={isMobile ? true : finder.fullscreen}
          isMinimized={finder.minimized}
          isFocused={focused === "finder"}
          onFocus={() => setFocused("finder")}
          className={focused === "finder" ? "z-50" : "z-40"}
          minimizeTargetEl={dockElForType("finder")}
          onClose={() => closeWin(setFinder, "finder")}
          onMinimize={() => minimizeWin(setFinder, "finder")}
          onToggleFullscreen={isMobile ? undefined : () => toggleFullscreen(setFinder, "finder")}
        >
          <FinderApp />
        </MacWindow>
      )}

      {about.open && (
        <MacWindow
          title="Notes"
          isFullscreen={isMobile ? true : about.fullscreen}
          isMinimized={about.minimized}
          isFocused={focused === "about"}
          onFocus={() => setFocused("about")}
          className={focused === "about" ? "z-50" : "z-40"}
          minimizeTargetEl={dockElForType("about")}
          onClose={() => closeWin(setAbout, "about")}
          onMinimize={() => minimizeWin(setAbout, "about")}
          onToggleFullscreen={isMobile ? undefined : () => toggleFullscreen(setAbout, "about")}
        >
          <NotesApp />
        </MacWindow>
      )}

      {contact.open && (
        <MacWindow
          title="Contact"
          isFullscreen={true}
          isMinimized={contact.minimized}
          isFocused={focused === "contact"}
          onFocus={() => setFocused("contact")}
          className={focused === "contact" ? "z-50" : "z-40"}
          minimizeTargetEl={dockElForType("contact")}
          onClose={() => closeWin(setContact, "contact")}
          onMinimize={() => minimizeWin(setContact, "contact")}
        >
          <Contact onClose={() => closeWin(setContact, "contact")} />
        </MacWindow>
      )}

      <Dock items={dockItems} iconRefs={dockIconRefs} pinnedCount={5} />
    </div>
  );
}
