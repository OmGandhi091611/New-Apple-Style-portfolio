// src/constants/index.js

// ===============================
// Navbar
// ===============================
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

  papers: [
    {
      id: "treemedchain",
      type: "item",
      name: "TreeMedChain",
      subtitle: "Medical records integrity concept + draft",
      tags: ["Healthcare", "Blockchain"],
      action: { kind: "noop" },
    },
    {
      id: "dijkstranet",
      type: "item",
      name: "DijkstraNet",
      subtitle: "Attention-guided routing optimizer (research idea)",
      tags: ["Networks", "GNN", "Optimization"],
      action: { kind: "noop" },
    },
  ],
};

// ===============================
// Dock defaults (optional)
// ===============================
export const DOCK_APPS = [
  {
    id: "terminal",
    label: "Terminal",
    type: "terminal",
    iconBg: "bg-zinc-900/80 border border-white/10",
  },
  {
    id: "finder",
    label: "Finder",
    type: "finder",
    iconBg: "bg-gradient-to-b from-sky-400/90 to-blue-600/90",
  },
  {
    id: "notes",
    label: "Notes",
    type: "about",
    iconBg: "bg-yellow-400/90",
  },
  {
    id: "resume",
    label: "Resume",
    type: "resume",
    iconBg: "bg-rose-500/90",
  },
  {
    id: "contact",
    label: "Contact",
    type: "contact",
    iconBg: "bg-emerald-500/90",
  },
];

export const SOCIAL_LINKS = {
  github: "https://github.com/OmGandhi091611",
  linkedin: "https://www.linkedin.com/in/omgandhi1611/",
};

export const DOCK_EXTRAS = [
  { id: "github", label: "GitHub", type: "github", iconBg: "bg-zinc-800/90" },
  { id: "linkedin", label: "LinkedIn", type: "linkedin", iconBg: "bg-blue-600/90" },
  { id: "settings", label: "Settings", type: "settings", iconBg: "bg-orange-500/90" },
  { id: "trash", label: "Trash", type: "trash", iconBg: "bg-rose-500/90" },
];

// ===============================
// Music / Control Center tracks
// Put mp3 files in /public/audio
// ===============================
export const MUSIC_TRACKS = [
  {
    id: "t1",
    title: "Dhurandhar - Title Track",
    artist: "Shashwat Sachdev, Hanumankind, Jasmine Sandlas",
    src: "/audio/Dhurandhar - Title Track  Ranveer Singh, Shashwat Sachdev, Hanumankind, Jasmine Sandlas,Aditya Dhar.mp3",
  },
  {
    id: "t2",
    title: "Ishq Jalakar - Karvaan",
    artist: "Shashwat Sachdev",
    src: "/audio/Ishq Jalakar - Karvaan  Dhurandhar  Ranveer Singh, Shashwat Sachdev, Aditya Dhar  Releasing 5 Dec.mp3",
  },
  {
    id: "t3",
    title: "Move - Yeh Ishq Ishq (From Dhurandhar)",
    artist: "Shashwat Sachdev, Reble, Sonu Nigam, Roshan, Sahir Ludhianvi",
    src: "/audio/Move - Yeh Ishq Ishq (From Dhurandhar).mp3",
  },
  {
    id: "t4",
    title: "Khaabon ke Parindey",
    artist: "Mohit chauhan, Alyssa Mendonsa",
    src: "/audio/Khaabon Ke Parinday (Full video song) Zindagi Na Milegi Dobara  Hrithik Roshan, Kartina Kaif.mp3",
  },
  {
    id: "t5",
    title: "Panwadi  Sunny Sanskari Ki Tulsi Kumari",
    artist: "Sanya A.P.S, Khesari Lal, Masoom S",
    src: "/audio/Panwadi  Sunny Sanskari Ki Tulsi Kumari  Varun, Janhvi, Rohit, Sanya A.P.S, Khesari Lal, Masoom S.mp3",
  },
  {
    id: "t6",
    title: "Bharat Ki Beti - Lyrical - Gunjan Saxena",
    artist: "Arijit Singh  Amit Trivedi Kausar Munir",
    src: "/audio/Bharat Ki Beti - Lyrical - Gunjan Saxena  Janhvi Kapoor  Arijit Singh  Amit Trivedi Kausar Munir.mp3",
  },
  {
    id: "t7",
    title: "Chaand Ne Kaho",
    artist: "Sachin-Jigar  Jigardan",
    src: "/audio/Chaand Ne Kaho  Sachin-Jigar  Jigardan  Yash Soni  Aarohi  Gujarati Song  Chaal Jeevi Laiye.mp3",
  },
  {
    id: "t8",
    title: "Dhun Laagi",
    artist: "Sachin-Jigar  Siddharth Amit Bhavsar",
    src: "/audio/Dhun Laagi  Full Audio Song  Love Ni Bhavai  Sachin-Jigar  Siddharth Amit Bhavsar.mp3",
  },
  {
    id: "t9",
    title: "Dil Jhoom",
    artist: "Simratt K  Mithoon, Sayeed Quadri",
    src: "/audio/Dil Jhoom  Gadar 2  Arijit Singh  Sunny Deol, Utkarsh Sharma, Simratt K  Mithoon, Sayeed Quadri.mp3",
  },
  {
    id: "t10",
    title: "Journey Song Full Audio",
    artist: "Amitabh Bachchan, Irrfan Khan & Deepika Padukone",
    src: "/audio/Journey Song Full Audio  Piku  Amitabh Bachchan, Irrfan Khan & Deepika Padukone.mp3",
  },
  {
    id: "t11",
    title: "Aavan Jaavan Song",
    artist: "Pritam, Arijit Singh, Nikhita, Amitabh",
    src: "/audio/Lyrical  Aavan Jaavan Song  War 2  Hrithik Roshan, Kiara  Pritam, Arijit Singh, Nikhita, Amitabh.mp3",
  },
  {
    id: "t12",
    title: "Der Lagi Lekin",
    artist: "Shankar Mahadevan",
    src: "/audio/Lyrical _ 'Der Lagi Lekin'  Zindagi Na Milegi Dobara  Hrithik Roshan, Farhan Akhtar.mp3",
  },
  {
    id: "t13",
    title: "Adhoore Song",
    artist: "Vishal-Shekhar",
    src: "/audio/LYRICAL_ Adhoore Song  Break Ke Baad  Imraan Khan, Deepika Padukone.mp3",
  },
  {
    id: "t14",
    title: "Mann Melo",
    artist: "Jasleen Royal",
    src: "/audio/Mann Melo (HD)  Sharato Lagu  Malhar Thakar Ane Deeksha Joshi Nu Romantic Gujarati Song.mp3",
  },
  {
    id: "t15",
    title: "Pyaar Hota Kayi Baar Hai",
    artist: "Pritam,Arijit,Amitabh",
    src: "/audio/Pyaar Hota Kayi Baar Hai (Full video) Tu Jhoothi Main Makkaar Ranbir,Shraddha,Pritam,Arijit,Amitabh.mp3",
  },
  {
    id: "t16",
    title: "Sahiba",
    artist: "Stebin, PriyaAditya, Sudhanshu, Jasleen Royal",
    src: "/audio/Sahiba (Music Video) Jasleen Royal Vijay Deverakonda Radhika Madan Stebin PriyaAditya Sudhanshu.mp3",
  },
  {
    id: "t17",
    title: "Tainu Khabar Nahi",
    artist: "Sachin-Jigar, Arijit Singh, Amitabh Bhattacharya",
    src: "/audio/Tainu Khabar Nahi  Munjya  Sharvari, Abhay Verma Sachin-Jigar, Arijit Singh, Amitabh Bhattacharya.mp3",
  },
  {
    id: "t18",
    title: "Vairaagi Re",
    artist: "Madhubanti Bagchi, Siddarth Amit Bhavsar",
    src: "/audio/Vairaagi Re  Official Song  Raunaq Kamdar  Anjali Barot  Chabutro Movie Song.mp3",
  },
  {
    id: "t19",
    title: "Vhalam Aavo Ne",
    artist: "Sachin-Jigar, Jigardan Gadhavi",
    src: "/audio/Vhalam Aavo Ne  Full Audio Song  Love Ni Bhavai  Sachin-Jigar  Jigardan Gadhavi.mp3",
  },
  {
    id: "t20",
    title: "Nazaare Ho",
    artist: "Karthik Rao",
    src: "/audio/Dice Media Nazaare Ho Music Video Ayush, Anshul, Sarah Karthik Rao.mp3",
  },
  {
    id: "t21",
    title: "Sang Hoon Tere",
    artist: "Bhuvan Bam",
    src: "/audio/Bhuvan Bam- Sang Hoon Tere  Official Music Video.mp3",
  },
  {
    id: "t22",
    title: "Heer Ranjha",
    artist: "Bhuvan Bam",
    src: "/audio/Heer Ranjha - Bhuvan Bam  Official Music Video.mp3",
  },
  {
    id: "t23",
    title: "DILJANIYA",
    artist: "Sonu Nigam",
    src: "/audio/DILJANIYA  Sonu Nigam  Rohan Rohan  Official Music Video  Wrong Number  Apoorva, Ambrish  RVCJ.mp3",
  },
  {
    id: "t24",
    title: "Rudrashtakam",
    artist: "Sonu Nigam",
    src: "/audio/Rudrashtakam  Official Music Video  Sonu Nigam  I Believe Music  Global Music Junction.mp3",
  },
  {
    id: "t25",
    title: "Shree Hanuman Chalisa",
    artist: "Sonu Nigam",
    src: "/audio/Sonu Nigam  Shree Hanuman Chalisa  Bhakti Bhajan  Global Music Junction.mp3",
  },
  {
    id: "t26",
    title: "Chale Jaise Hawaien",
    artist: "KK, Vasundhara Das",
    src: "/audio/Chale Jaise Hawaien [Full Song] Main Hoon Na.mp3",
  },
  {
    id: "t27",
    title: "Enemy",
    artist: "Tommee Profitt, Sam Tinnesz & Beacon Light",
    src: "/audio/Enemy - Tommee Profitt, Sam Tinnesz & Beacon Light.mp3",
  },
  {
    id: "t28",
    title: "This Is How You Walk On",
    artist: "Gary Lightbody & Johnny McDaid",
    src: "/audio/Gary Lightbody & Johnny McDaid - This Is How You Walk On (From Gifted).mp3",
  },
  {
    id: "t29",
    title: "Ghar More Pardesiya",
    artist: "Vaishali, Pritam, Amitabh",
    src: "/audio/Ghar More Pardesiya - Full Video Kalank  Varun, Alia & Madhuri Shreya & Vaishali Pritam Amitabh.mp3",
  },
  {
    id: "t30",
    title: "Haan Ke Haan",
    artist: "Sohail Sen, Monali Thakur, Kausar M",
    src: "/audio/Haan Ke Haan Song  Maharaj  A Netflix Film  Junaid, Sharvari, Sohail Sen, Monali Thakur, Kausar M.mp3",
  },
  {
    id: "t31",
    title: "Jaikal Mahakal",
    artist: "Amit Trivedi, Swanand K",
    src: "/audio/Jaikal Mahakal - Full Video  Goodbye  Amitabh Bachchan, Rashmika Mandanna Amit Trivedi, Swanand K.mp3",
  },
  {
    id: "t32",
    title: "Phir Milenge Chalte Chalte",
    artist: "Sonu Nigam",
    src: "/audio/Phir Milenge Chalte Chalte - Full Song  Rab Ne Bana Di Jodi  Shah Rukh Khan  Sonu Nigam.mp3",
  },
  {
    id: "t33",
    title: "Naruto and Hinata",
    artist: "Instrumental",
    src: "/audio/The Last_ Naruto the Movie ost - 40 - Naruto and Hinata.mp3",
  },
  {
    id: "t34",
    title: "Tum Jo Mil Gaye",
    artist: "Music",
    src: "/audio/Tum Jo Mil Gaye - Bade Achhe Lagte Hain - Season 3  #RaYa #badeachhelagtehain3.mp3",
  },
  {
    id: "t35",
    title: "Wat Wat Wat",
    artist: "Arijit Singh",
    src: "/audio/Wat Wat Wat FULL AUDIO Song  Tamasha  Ranbir Kapoor, Deepika Padukone  T-Series.mp3",
  },
];
