import { Github, Linkedin, Mail, FileText } from "lucide-react";
import { SITE } from "#constants";
import Reveal from "./Reveal";

export default function Hero() {
  return (
    <Reveal id="top" className="pb-10 sm:pt-16">
      <div className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-(--color-ink-faint)">
            {SITE.affiliation}
          </p>
          <h1 className="text-3xl font-semibold text-(--color-ink) sm:text-4xl">
            {SITE.name}
          </h1>
          <p className="mt-2 text-lg text-(--color-ink-soft)">{SITE.tagline}</p>
          <p className="mt-1 text-sm text-(--color-ink-faint)">{SITE.focus}</p>
        </div>

        <img
          src={SITE.photoUrl}
          alt={SITE.name}
          className="size-64 shrink-0 self-center rounded-full border border-(--color-line) object-cover sm:size-[280px] sm:translate-y-16"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-1.5 link-accent">
          <Mail size={15} /> Email
        </a>
        <a
          href={SITE.github}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 link-accent"
        >
          <Github size={15} /> GitHub
        </a>
        <a
          href={SITE.linkedin}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 link-accent"
        >
          <Linkedin size={15} /> LinkedIn
        </a>
        <a href={SITE.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 link-accent">
          <FileText size={15} /> CV
        </a>
      </div>
    </Reveal>
  );
}
