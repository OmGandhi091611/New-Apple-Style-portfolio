import { Moon, Sun } from "lucide-react";
import { SITE, PHOTOS } from "#constants";
import { Footer } from "#components";
import { useTheme } from "#lib/theme";

export default function PhotosPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-dvh">
      <header className="border-b border-(--color-line)">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <a href="/" className="text-sm font-semibold text-(--color-ink)">
            {SITE.name}
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-(--color-ink-soft) hover:text-(--color-ink)">
              ← Back to site
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="text-(--color-ink-soft) hover:text-(--color-ink)"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <section className="section">
        <h1 className="text-2xl font-semibold text-(--color-ink)">Photos</h1>
        <p className="mt-1 mb-8 text-sm text-(--color-ink-soft)">
          Family, nature, and moments outside of work.
        </p>

        {PHOTOS.length === 0 ? (
          <p className="text-sm text-(--color-ink-faint)">More photos coming soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PHOTOS.map((photo) => (
              <figure
                key={photo.id}
                className="overflow-hidden rounded-lg border border-(--color-line)"
              >
                <img
                  src={photo.src}
                  alt={photo.caption ?? ""}
                  className="aspect-square w-full object-cover"
                />
                {photo.caption && (
                  <figcaption className="px-2 py-1.5 text-xs text-(--color-ink-faint)">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
