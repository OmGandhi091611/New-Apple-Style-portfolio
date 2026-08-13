import { SITE } from "#constants";

export default function Footer() {
  return (
    <footer className="border-t border-(--color-line)">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-6 py-8 text-xs text-(--color-ink-faint)">
        <span>
          © {new Date().getFullYear()} {SITE.name}
        </span>
        <span>Built with React &amp; Tailwind CSS</span>
      </div>
    </footer>
  );
}
