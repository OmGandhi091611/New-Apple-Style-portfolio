import { BIO, SKILLS } from "#constants";
import Reveal from "./Reveal";

export default function About() {
  return (
    <Reveal id="about">
      <h2 className="section-heading">About</h2>
      <div className="space-y-4 text-(--color-ink-soft)">
        {BIO.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Object.entries(SKILLS).map(([group, items]) => (
          <div key={group}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-ink-faint)">
              {group}
            </h3>
            <ul className="space-y-1 text-sm text-(--color-ink-soft)">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
