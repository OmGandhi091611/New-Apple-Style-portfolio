// src/constants/index.js

// ===============================
// Navbar
// ===============================

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

import papersData from "../data/papers.json";

export const navLinks = [
  { id: 1, name: "Projects", type: "finder", section: "projects" },
  { id: 2, name: "Education", type: "finder", section: "education" },
  { id: 3, name: "Papers", type: "finder", section: "papers" },
  { id: 4, name: "Resume", type: "resume" },
];


export const navIcons = [
  { id: 1, img: "/icons/wifi.svg" },
  { id: 2, img: "/icons/search.svg" },
  { id: 3, img: "/icons/user.svg" },
  { id: 4, img: "/icons/mode.svg" },
];

// ===============================
// Terminal / Desktop profile
// ===============================
export const TERMINAL_PROFILE = {
  username: "om",
  hostname: "macbook",
  home: "/Users/om",
  resumeUrl: "/Om_Amit_Gandhi_Resume.pdf",
  contactEmail: "ogandhi1@hawk.illinoistect.edu",
};

// Commands available (help + autocomplete)
export const TERMINAL_COMMANDS = [
  "help",
  "clear",
  "pwd",
  "ls",
  "cd",
  "cat",
  "open",
  "projects",
];

// "open <target>" targets (UI actions)
export const OPEN_TARGETS = ["projects", "about", "contact"];

// Tiny virtual filesystem backing `ls/cd/cat`
export const makeVFS = (HOME) => ({
  "/": { type: "dir", children: ["Users"] },
  "/Users": { type: "dir", children: ["om"] },

  [HOME]: {
    type: "dir",
    children: [
      "Projects",
      "Experience",
      "Education",
      "Papers",
      "Contact",
      "about",
      "resume.pdf",
    ],
  },

  // optional folder so `cd about` doesn't error
  [`${HOME}/about`]: { type: "dir", children: [] },

  [`${HOME}/Projects`]: { type: "dir", children: ["memo.md", "pos.md"] },
  [`${HOME}/Experience`]: { type: "dir", children: ["ta.md", "research.md"] },
  [`${HOME}/Education`]: { type: "dir", children: ["iit_ms.md", "iit_phd.md"] },
  [`${HOME}/Papers`]: { type: "dir", children: ["treemedchain.md", "dijkstranet.md"] },
  [`${HOME}/Contact`]: { type: "dir", children: ["email.txt"] },

  // files
  [`${HOME}/resume.pdf`]: { type: "file", content: "(binary)" },

  [`${HOME}/Projects/memo.md`]: {
    type: "file",
    content:
      "MEMO Sharding Simulator — SimPy, shard scaling, throughput/latency evaluation.",
  },
  [`${HOME}/Projects/pos.md`]: {
    type: "file",
    content:
      "Proof-of-Space (BLAKE3) — C/OpenMP, bucket sorting, out-of-memory merging.",
  },

  [`${HOME}/Experience/ta.md`]: {
    type: "file",
    content:
      "Teaching Assistant — CS458 (Security). Office hours, grading, student support.",
  },
  [`${HOME}/Experience/research.md`]: {
    type: "file",
    content:
      "Blockchain research — sharding, scalability modeling, distributed systems simulation.",
  },

  [`${HOME}/Education/iit_ms.md`]: {
    type: "file",
    content:
      "Illinois Institute of Technology — M.S. Computer Science (InfoSec & Assurance).",
  },
  [`${HOME}/Education/iit_phd.md`]: {
    type: "file",
    content:
      "Illinois Institute of Technology — Ph.D. Computer Science (focus: blockchain systems).",
  },

  [`${HOME}/Papers/treemedchain.md`]: {
    type: "file",
    content:
      "TreeMedChain — concept/paper draft related to medical records + data integrity.",
  },
  [`${HOME}/Papers/dijkstranet.md`]: {
    type: "file",
    content:
      "DijkstraNet — idea: attention-guided dynamic shortest path routing.",
  },

  [`${HOME}/Contact/email.txt`]: {
    type: "file",
    content: "ogandhi1@hawk.illinoistech.edu",
  },
});

// Help text shown in terminal
export const terminalHelpText = [
  "Commands:",
  "  help",
  "  clear",
  "  pwd",
  "  ls",
  "  cd <dir>",
  "  cat <file>",
  "  open <file|projects|about|contact>",
  "  projects",
  "",
  "Shortcuts:",
  "  Tab        autocomplete",
  "  Ctrl+R     reverse history search (Esc/Ctrl+G to cancel)",
  "  ↑/↓        command history",
  "  Ctrl+L     clear",
  "  Ctrl+C     cancel line",
  "",
  "Examples:",
  "  ls",
  "  open about",
  "  open resume.pdf",
  "  projects",
].join("\n");

// ===============================
// Notes (About) content
// ===============================
export const NOTES_DEFAULT_ACTIVE_ID = "about";
export const NOTES_DATA = [
  {
    id: "about",
    title: "About Om",
    date: "Today",
    body: `Hi, I’m Om Gandhi.

I work on blockchain systems, distributed computing, and security.
I enjoy building performance-heavy systems (C/OpenMP, simulators) and clean UIs (React + Tailwind).

Try in Terminal:
  open about
  open projects
  open resume.pdf

Current focus:
- Sharding simulations (NEAR/MEMO)
- Proof-of-Space pipelines
- Performance + scalability research`,
  },
  {
    id: "skills",
    title: "Skills",
    date: "Today",
    body: `Languages: C/C++, Python, JavaScript/TypeScript, Java
Frameworks: React, Vite, Tailwind
Systems: SimPy, OpenMP, Linux tooling
Interests: Blockchain, distributed systems, security, AI`,
  },
];

// ===============================
// Finder data (NEW)
// ===============================
export const FINDER_DATA = {
  root: [
    { id: "projects", type: "folder", name: "Projects" },
    { id: "experience", type: "folder", name: "Experience" },
    { id: "education", type: "folder", name: "Education" },
    { id: "papers", type: "folder", name: "Research Papers" },
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

  experience: [
    {
      id: "ta",
      type: "item",
      name: "Teaching Assistant",
      subtitle: "CS458 • Security • Office hours & grading",
      tags: ["Teaching", "Security"],
      action: { kind: "noop" },
    },
    {
      id: "research",
      type: "item",
      name: "Blockchain Research",
      subtitle: "Sharding • Consensus • Distributed systems",
      tags: ["Research", "Blockchain"],
      action: { kind: "noop" },
    },
  ],

  education: [
    {
      id: "iit_ms",
      type: "item",
      name: "Illinois Institute of Technology — M.S.",
      subtitle: "Computer Science (InfoSec & Assurance)",
      tags: ["IIT", "Masters", "Security"],
      action: { kind: "noop" },
    },
    {
      id: "iit_phd",
      type: "item",
      name: "Illinois Institute of Technology — Ph.D.",
      subtitle: "Computer Science (Blockchain systems)",
      tags: ["IIT", "PhD", "Blockchain"],
      action: { kind: "noop" },
    },
  ],

  papers: papersData,
};

// ===============================
// Dock defaults (optional)
// ===============================
// ===============================
// Dock defaults
// ===============================
export const DOCK_APPS = [
  {
    id: "terminal",
    label: "Terminal",
    type: "terminal",
    iconName: "terminal",
    iconColor: "text-zinc-100",
    iconBg: "bg-zinc-900/80 border border-white/10",
  },
  {
    id: "finder",
    label: "Finder",
    type: "finder",
    iconName: "folder",
    iconColor: "text-sky-300",
    iconBg: "bg-gradient-to-b from-sky-400/90 to-blue-600/90",
  },
  {
    id: "notes",
    label: "Notes",
    type: "about",
    iconName: "fileText",
    iconColor: "text-violet-300",
    iconBg: "bg-gradient-to-b from-violet-400/90 to-purple-600/90",
  },
  {
    id: "resume",
    label: "Resume",
    type: "resume",
    iconName: "fileText",
    iconColor: "text-emerald-300",
    iconBg: "bg-gradient-to-b from-emerald-400/90 to-teal-600/90",
  },
  {
    id: "contact",
    label: "Contact",
    type: "contact",
    iconName: "mail",
    iconColor: "text-pink-300",
    iconBg: "bg-gradient-to-b from-pink-400/90 to-rose-600/90",
  },
];

export const SOCIAL_LINKS = {
  github: "https://github.com/OmGandhi091611",
  linkedin: "https://www.linkedin.com/in/omgandhi1611/",
};

export const DOCK_EXTRAS = [
  {
    id: "github",
    label: "GitHub",
    type: "github",
    iconName: "github",
    iconColor: "text-white/90",
    iconBg: "bg-zinc-800/90",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    type: "linkedin",
    iconName: "linkedin",
    iconColor: "text-cyan-300",
    iconBg: "bg-blue-600/90",
  },
  {
    id: "settings",
    label: "Settings",
    type: "settings",
    iconName: "settings",
    iconColor: "text-orange-300",
    iconBg: "bg-orange-500/90",
  },
  {
    id: "trash",
    label: "Trash",
    type: "trash",
    iconName: "trash",
    iconColor: "text-rose-300",
    iconBg: "bg-rose-500/90",
  },
];


