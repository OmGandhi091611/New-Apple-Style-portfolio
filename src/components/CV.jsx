import { FileText } from "lucide-react";
import { SITE } from "#constants";
import Reveal from "./Reveal";

export default function CV() {
  return (
    <Reveal id="cv">
      <h2 className="section-heading">CV</h2>
      <p className="text-sm text-(--color-ink-soft)">
        For a full record of my education, research, publications, and experience, view my CV.
      </p>
      <a
        href={SITE.cvUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-(--color-ink) px-4 py-2 text-sm font-medium text-(--color-paper) transition-colors hover:bg-(--color-ink-soft)"
      >
        <FileText size={15} /> View CV (PDF)
      </a>
    </Reveal>
  );
}
