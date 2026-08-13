import { BEYOND_ACADEMIA } from "#constants";
import Reveal from "./Reveal";

export default function BeyondAcademia() {
  return (
    <Reveal id="beyond">
      <h2 className="section-heading">Beyond Academia</h2>
      <ul className="space-y-3">
        {BEYOND_ACADEMIA.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-(--color-ink-soft)">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-(--color-ink-faint)" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
