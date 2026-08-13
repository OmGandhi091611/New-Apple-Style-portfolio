import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { NAV_LINKS, SITE } from "#constants";
import { useActiveSection } from "#lib/useActiveSection";
import { smoothScrollTo } from "#lib/smoothScrollTo";
import { useTheme } from "#lib/theme";

const SECTION_IDS = NAV_LINKS.filter((link) => link.id).map((link) => link.id);

export default function SiteNav() {
  const activeId = useActiveSection(SECTION_IDS);
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleClick = (e, id) => {
    e.preventDefault();
    setMenuOpen(false);
    smoothScrollTo(id);
  };

  const linkClassName = (isActive) =>
    isActive
      ? "text-sm font-medium whitespace-nowrap text-(--color-accent)"
      : "text-sm whitespace-nowrap text-(--color-ink-soft) hover:text-(--color-ink)";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-(--color-line) bg-(--color-paper)/90 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
          <a
            href="#top"
            onClick={(e) => handleClick(e, "top")}
            className="shrink-0 text-sm font-semibold whitespace-nowrap text-(--color-ink)"
          >
            {SITE.name}
          </a>

          <ul className="hidden items-center gap-x-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.id ?? link.href}>
                {link.href ? (
                  <a href={link.href} className={linkClassName(false)}>
                    {link.label}
                  </a>
                ) : (
                  <a
                    href={`#${link.id}`}
                    onClick={(e) => handleClick(e, link.id)}
                    className={linkClassName(link.id === activeId)}
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="text-(--color-ink-soft) hover:text-(--color-ink)"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="text-(--color-ink-soft) hover:text-(--color-ink) lg:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
        className={[
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Slide-in panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={[
          "fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-(--color-paper) px-6 py-5 shadow-xl transition-transform duration-300 ease-out lg:hidden",
          menuOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="mb-4 flex items-center justify-between border-b border-(--color-line) pb-4">
          <span className="text-sm font-semibold text-(--color-ink)">Menu</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="text-(--color-ink-soft) hover:text-(--color-ink)"
          >
            <X size={20} />
          </button>
        </div>

        {NAV_LINKS.map((link, i) => {
          const isActive = link.id === activeId;
          const itemClassName = [
            "py-1.5 text-sm transition-all duration-300",
            menuOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
            isActive
              ? "font-medium text-(--color-accent)"
              : "text-(--color-ink-soft) hover:text-(--color-ink)",
          ].join(" ");
          const style = { transitionDelay: menuOpen ? `${80 + i * 40}ms` : "0ms" };

          return link.href ? (
            <a key={link.href} href={link.href} style={style} className={itemClassName}>
              {link.label}
            </a>
          ) : (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleClick(e, link.id)}
              style={style}
              className={itemClassName}
            >
              {link.label}
            </a>
          );
        })}
      </div>
    </>
  );
}
