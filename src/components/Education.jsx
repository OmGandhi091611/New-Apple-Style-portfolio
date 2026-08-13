import { EDUCATION } from "#constants";
import Reveal from "./Reveal";

export default function Education() {
  return (
    <Reveal id="education">
      <h2 className="section-heading">Education</h2>
      <div className="space-y-5">
        {EDUCATION.map((item) => (
          <div key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div>
              <h3 className="font-medium text-(--color-ink)">{item.degree}</h3>
              <p className="text-sm text-(--color-ink-soft)">
                {item.focus} · {item.org}
              </p>
            </div>
            {item.period && (
              <span className="font-mono text-xs text-(--color-ink-faint)">{item.period}</span>
            )}
          </div>
        ))}
      </div>
    </Reveal>
  );
}
