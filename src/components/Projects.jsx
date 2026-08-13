import { ArrowUpRight } from "lucide-react";
import { PROJECTS } from "#constants";
import Reveal from "./Reveal";

export default function Projects() {
  return (
    <Reveal id="projects">
      <h2 className="section-heading">Projects</h2>
      <div className="space-y-6">
        {PROJECTS.map((project) => (
          <a
            key={project.id}
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-lg border border-(--color-line) p-4 transition-colors hover:border-(--color-ink-faint)"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium text-(--color-ink)">{project.title}</h3>
              <ArrowUpRight
                size={16}
                className="mt-0.5 shrink-0 text-(--color-ink-faint) transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
            <p className="mt-1 text-sm text-(--color-ink-soft)">{project.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </Reveal>
  );
}
