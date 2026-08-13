// src/constants/index.js
import papersData from "../data/papers.json";
import photosData from "../data/photos.json";

export const SITE = {
  name: "Om Amit Gandhi",
  tagline: "PhD Student, Computer Science",
  affiliation: "Illinois Institute of Technology",
  focus: "Distributed Systems · Parallel Computing · Blockchain Systems · Networking and Security",
  email: "ogandhi1@hawk.illinoistech.edu",
  github: "https://github.com/OmGandhi091611",
  linkedin: "https://www.linkedin.com/in/omgandhi1611/",
  cvUrl: "/Om_Amit_Gandhi_CV.pdf",
  resumeUrl: "/Om_Amit_Gandhi_Resume.pdf",
  photoUrl: "/Om.jpg",
};

export const NAV_LINKS = [
  { id: "about", label: "About" },
  { id: "publications", label: "Publications" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "cv", label: "CV" },
  { id: "beyond", label: "Beyond Academia" },
  { href: "/photos", label: "Photos" },
  { id: "contact", label: "Contact" },
];

// Populated via the admin panel's Photos tab (src/data/photos.json) — or
// add files to public/photos/ and list them in that file manually.
export const PHOTOS = photosData;

export const BIO = `Hi, I am a second year PhD student. My Research is in distributed systems, parallel computing, blockchain systems, and networking and security. I work on building performance-heavy systems (C/OpenMP, discrete-event simulators) and studying how they scale.

My current research centers on sharded blockchain architectures, GPU-accelerated consensus, and simulation-based performance evaluation of distributed systems.`;

export const SKILLS = {
  Languages: ["C/C++", "Python", "JavaScript/TypeScript", "Java"],
  "Frameworks & Tools": ["React", "Vite", "Tailwind CSS", "SimPy", "OpenMP"],
  Interests: ["Distributed Systems", "Parallel Computing", "Blockchain Systems", "Networking and Security"],
};

export const PUBLICATIONS = papersData.map((p) => ({
  id: p.id,
  title: p.name,
  description: p.subtitle,
  authors: p.authors,
  tags: p.tags,
  href: p.action?.kind === "link" ? p.action.href : undefined,
}));

export const PROJECTS = [
  {
    id: "memo",
    title: "MEMO Sharding Simulator",
    description: "SimPy-based simulator for sharded blockchain architectures — throughput/latency evaluation under shard scaling.",
    tags: ["Blockchain", "Simulation", "Sharding"],
    href: "https://github.com/OmGandhi091611/Sharding_Simulations",
  },
  {
    id: "pos",
    title: "Proof-of-Space (BLAKE3)",
    description: "C/OpenMP implementation of Proof-of-Space plotting — bucket sorting and out-of-memory merging for GPU-accelerated consensus.",
    tags: ["Systems", "C", "Performance"],
    href: "https://github.com/iraicu/vaultx",
  },
];

export const EXPERIENCE = [
  {
    id: "research",
    role: "Research Assistant",
    org: "Illinois Institute of Technology",
    period: "Aug 2025 – Present",
    description:
      "I research distributed systems, parallel computing, blockchain sharding, and networking and security. I'm designing a discrete-event blockchain simulator to compare sharded and non-sharded architectures under configurable workloads and network conditions, modeling protocol mechanisms (fee markets, reward halving, difficulty adjustment), and running reproducible evaluation workflows for ongoing publications.",
    tags: ["Research", "Distributed Systems", "Parallel Computing", "Blockchain Systems", "Networking and Security"],
  },
  {
    id: "ta",
    role: "Teaching Assistant — CS458 (Introduction to Information Security)",
    org: "Illinois Institute of Technology",
    period: "Aug 2025 – May 2026",
    description:
      "Office hours, grading, and student support; coordinated with instructors and TA teams to standardize grading practices and course communication.",
    tags: ["Teaching", "Security"],
  },
  {
    id: "minimal_dot",
    role: "Junior Web Developer",
    org: "Minimal Dot",
    period: "Feb 2023 – Jul 2023",
    description:
      "Developed and maintained client-facing UI components using Angular; collaborated on debugging, testing, and front-end optimization across production web applications.",
    tags: ["Angular", "Web Development"],
  },
  {
    id: "tatvasoft",
    role: "Web Development Intern",
    org: "TatvaSoft",
    period: "Jun 2022 – Jul 2022",
    description:
      "Contributed to a team-based e-commerce bookstore application; implemented role-based UI workflows with TypeScript, PostgreSQL, and .NET.",
    tags: ["TypeScript", "PostgreSQL", ".NET"],
  },
];

// Placeholder — swap these for your actual interests.
export const BEYOND_ACADEMIA = [
  "I am currently watching too much anime, Naruto, Attack on Titan, One Piece, etc. In short all the anime live rent free in my head.",
  "I love clicking pictures of naturistic views, you can find some of them here or my instagram highlights.",
  "I am a big fan of sci-fi novels and technology.",
  "I enjoy playing GTA V and Call of Duty in my free time and mostly you would find me watching a classic Indian show C.I.D.",
  "Chai over coffee, always. If anyone who prefers coffee, I am fine, just don't ask me to even taste it.",
  "I am trying to learn new recipes and also how to play a guitar.",
  "I am also. trying to stay consistent with my gym routine.",
];

export const EDUCATION = [
  {
    id: "iit_phd",
    degree: "Ph.D. in Computer Science",
    focus: "GPA 3.93/4.0",
    org: "Illinois Institute of Technology",
    period: "2025 – Present",
  },
  {
    id: "iit_ms",
    degree: "M.S. in Computer Science",
    focus: "GPA 3.9/4.0",
    org: "Illinois Institute of Technology",
    period: "2024 – 2025",
  },
  {
    id: "gtu_be",
    degree: "B.E. in Computer Engineering",
    focus: "GPA 3.6/4.0",
    org: "Gujarat Technological University",
    period: "2019 – 2023",
  },
];
