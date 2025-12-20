// src/components/FinderApp.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Folder,
  FileText,
  Search,
  LayoutGrid,
  List,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  FileBadge,
} from "lucide-react";

const DATA = {
  root: [
    { id: "projects", type: "folder", name: "Projects", icon: Folder },
    { id: "education", type: "folder", name: "Education", icon: GraduationCap },
    { id: "papers", type: "folder", name: "Papers", icon: BookOpen },
    {
      id: "resume",
      type: "item",
      name: "Resume",
      subtitle: "Open PDF in new tab",
      tags: ["PDF"],
      icon: FileBadge,
      action: { kind: "resume" },
    },
  ],

  projects: [
    {
      id: "memo",
      type: "item",
      name: "MEMO Sharding Simulator",
      subtitle: "SimPy • Sharding • Throughput/latency evaluation",
      tags: ["Blockchain", "Simulation", "Sharding"],
      action: { kind: "link", href: "https://github.com/OmGandhi091611/Sharding_Simulations" },
    },
    {
      id: "pos",
      type: "item",
      name: "Proof-of-Space (BLAKE3)",
      subtitle: "C/OpenMP • Bucket sort • Out-of-memory merge",
      tags: ["Systems", "C", "Performance"],
      action: { kind: "link", href: "https://github.com/iraicu/vaultx" },
    },
  ],

  education: [
    {
      id: "iit",
      type: "item",
      name: "Illinois Institute of Technology",
      subtitle: "PhD / Research focus: blockchain & distributed systems",
      tags: ["Chicago", "PhD"],
      action: { kind: "noop" },
    },
    {
      id: "ms",
      type: "item",
      name: "M.S. Computer Science",
      subtitle: "Specialization: Information Security & Assurance",
      tags: ["Security", "Systems"],
      action: { kind: "noop" },
    },
  ],

  papers: [
    {
      id: "p1",
      type: "item",
      name: "Sharding Simulations",
      subtitle: "Evaluation of sharding strategies (NEAR/MEMO-style) using a simulator",
      tags: ["Blockchain", "Sharding"],
      action: { kind: "noop" }, // replace with link later
    },
    {
      id: "p2",
      type: "item",
      name: "TreeMedChain",
      subtitle: "Healthcare + data security concept (paper/project)",
      tags: ["Healthcare", "Security"],
      action: { kind: "noop" }, // replace with link later
    },
  ],
};

function openLink(href) {
  window.open(href, "_blank", "noopener,noreferrer");
}

export default function FinderApp() {
  const [activeSection, setActiveSection] = useState("root");
  const [viewMode, setViewMode] = useState("grid");
  const [query, setQuery] = useState("");

  // ✅ allow DesktopShell/Navbar to jump Finder to a section
  useEffect(() => {
    const onNavigate = (e) => {
      const section = e.detail?.section || "root";
      const next = DATA[section] ? section : "root";
      setActiveSection(next);
      setQuery("");
    };

    window.addEventListener("finder:navigate", onNavigate);
    return () => window.removeEventListener("finder:navigate", onNavigate);
  }, []);

  const items = useMemo(() => {
    const base = DATA[activeSection] || [];
    if (!query.trim()) return base;
    const q = query.trim().toLowerCase();
    return base.filter((x) => {
      const hay = `${x.name} ${x.subtitle || ""} ${(x.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeSection, query]);

  const title = useMemo(() => {
    if (activeSection === "root") return "Home";
    return activeSection[0].toUpperCase() + activeSection.slice(1);
  }, [activeSection]);

  const onItemOpen = async (item) => {
    if (item.type === "folder") {
      setActiveSection(item.id);
      setQuery("");
      return;
    }

    const a = item.action || { kind: "noop" };

    if (a.kind === "link") openLink(a.href);

    if (a.kind === "resume") {
      // let DesktopShell handle it (consistent behavior)
      window.dispatchEvent(new CustomEvent("shell:open", { detail: { app: "resume" } }));
    }
  };

  return (
    <div className="h-full w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="hidden sm:flex w-56 flex-col border-r border-white/10 p-3">
          <div className="text-[11px] tracking-wide text-white/60 mb-2">FAVORITES</div>

          <SidebarButton
            active={activeSection === "root"}
            label="Home"
            onClick={() => {
              setActiveSection("root");
              setQuery("");
            }}
          />
          <SidebarButton
            active={activeSection === "projects"}
            label="Projects"
            onClick={() => {
              setActiveSection("projects");
              setQuery("");
            }}
          />
          <SidebarButton
            active={activeSection === "education"}
            label="Education"
            onClick={() => {
              setActiveSection("education");
              setQuery("");
            }}
          />
          <SidebarButton
            active={activeSection === "papers"}
            label="Papers"
            onClick={() => {
              setActiveSection("papers");
              setQuery("");
            }}
          />
        </aside>

        {/* Main */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 p-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <button
                className={[
                  "sm:hidden",
                  "h-9 w-9 grid place-items-center rounded-lg",
                  "hover:bg-white/10 active:bg-white/15",
                ].join(" ")}
                onClick={() => {
                  if (activeSection !== "root") setActiveSection("root");
                }}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4 text-white/80" />
              </button>

              <div className="text-sm text-white/80 truncate">{title}</div>

              <div className="ml-2 hidden md:flex items-center gap-1">
                <button
                  className={[
                    "h-9 w-9 grid place-items-center rounded-lg",
                    viewMode === "grid" ? "bg-white/10" : "hover:bg-white/10",
                  ].join(" ")}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4 text-white/80" />
                </button>
                <button
                  className={[
                    "h-9 w-9 grid place-items-center rounded-lg",
                    viewMode === "list" ? "bg-white/10" : "hover:bg-white/10",
                  ].join(" ")}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <List className="h-4 w-4 text-white/80" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-[180px] sm:w-[240px] md:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={[
                  "w-full rounded-xl border border-white/10 bg-black/20",
                  "pl-9 pr-3 py-2 text-sm text-white/90 outline-none",
                  "placeholder:text-white/40 focus:border-white/20",
                ].join(" ")}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-auto p-3">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {items.map((item) => (
                  <GridItem key={item.id} item={item} onOpen={() => onItemOpen(item)} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <ListItem key={item.id} item={item} onOpen={() => onItemOpen(item)} />
                ))}
              </div>
            )}

            {!items.length && <div className="mt-10 text-center text-sm text-white/60">No results</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function SidebarButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left px-2 py-2 rounded-lg text-sm",
        active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function GridItem({ item, onOpen }) {
  const Icon = item.icon || (item.type === "folder" ? Folder : FileText);

  return (
    <button
      onClick={onOpen}
      className={[
        "text-left rounded-xl border border-white/10 bg-white/5",
        "p-3 hover:bg-white/10 transition",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/10 grid place-items-center">
          <Icon className="h-5 w-5 text-white/80" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90 truncate">{item.name}</div>
          {item.subtitle && <div className="mt-1 text-xs text-white/65 line-clamp-2">{item.subtitle}</div>}
          {item.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 border border-white/10 text-white/70"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function ListItem({ item, onOpen }) {
  const Icon = item.icon || (item.type === "folder" ? Folder : FileText);

  return (
    <button
      onClick={onOpen}
      className={[
        "w-full text-left rounded-xl border border-white/10 bg-white/5",
        "p-3 hover:bg-white/10 transition",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white/10 grid place-items-center">
          <Icon className="h-4 w-4 text-white/80" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white/90 truncate">{item.name}</div>
          {item.subtitle && <div className="text-xs text-white/60 truncate">{item.subtitle}</div>}
        </div>
        <div className="text-xs text-white/40">{item.type === "folder" ? "Folder" : ""}</div>
      </div>
    </button>
  );
}
