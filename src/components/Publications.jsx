import { PUBLICATIONS } from "#constants";
import Reveal from "./Reveal";

export default function Publications() {
  return (
    <Reveal id="publications">
      <h2 className="section-heading">Publications</h2>
      <ol className="space-y-6">
        {PUBLICATIONS.map((pub, i) => (
          <li key={pub.id} className="flex gap-4">
            <span className="mt-0.5 font-mono text-sm text-(--color-ink-faint)">
              [{i + 1}]
            </span>
            <div>
              {pub.href ? (
                <a
                  href={pub.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-(--color-ink) link-accent decoration-transparent hover:decoration-(--color-accent)"
                >
                  {pub.title}
                </a>
              ) : (
                <span className="font-medium text-(--color-ink)">{pub.title}</span>
              )}
              {pub.authors?.length > 0 && (
                <p className="mt-0.5 text-xs text-(--color-ink-faint)">{pub.authors.join(", ")}</p>
              )}
              <p className="mt-1 text-sm text-(--color-ink-soft)">{pub.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pub.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
