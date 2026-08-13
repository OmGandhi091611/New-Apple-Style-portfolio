import { EXPERIENCE } from "#constants";
import Reveal from "./Reveal";

export default function Experience() {
  return (
    <Reveal id="experience">
      <h2 className="section-heading">Experience</h2>
      <div className="space-y-6">
        {EXPERIENCE.map((item) => (
          <div key={item.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-medium text-(--color-ink)">{item.role}</h3>
              {item.period && (
                <span className="font-mono text-xs text-(--color-ink-faint)">{item.period}</span>
              )}
            </div>
            <p className="text-sm text-(--color-ink-faint)">{item.org}</p>
            <p className="mt-1 text-sm text-(--color-ink-soft)">{item.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
