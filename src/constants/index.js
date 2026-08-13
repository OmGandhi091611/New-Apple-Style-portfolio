// src/constants/index.js
import papersData from "../data/papers.json";

export const SITE = {
  name: "Om Amit Gandhi",
  tagline: "PhD Student, Computer Science",
  affiliation: "Illinois Institute of Technology",
  focus: "Blockchain Systems · Distributed Computing · Security",
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
  { id: "contact", label: "Contact" },
];

export const BIO = `I work on blockchain systems, distributed computing, and security — building performance-heavy systems (C/OpenMP, discrete-event simulators) and studying how they scale.

My current research centers on sharded blockchain architectures, GPU-accelerated consensus, and simulation-based performance evaluation of distributed systems.`;

export const SKILLS = {
  Languages: ["C/C++", "Python", "JavaScript/TypeScript", "Java"],
  "Frameworks & Tools": ["React", "Vite", "Tailwind CSS", "SimPy", "OpenMP"],
  Interests: ["Blockchain", "Distributed Systems", "Security", "AI"],
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
      "Research in blockchain sharding and distributed systems. Designing a discrete-event blockchain simulator to compare sharded and non-sharded architectures under configurable workloads and network conditions, modeling protocol mechanisms (fee markets, reward halving, difficulty adjustment), and running reproducible evaluation workflows for ongoing publications.",
    tags: ["Research", "Blockchain", "Distributed Systems"],
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
