// src/components/NotesApp.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, FileText } from "lucide-react";
import { NOTES_DATA, NOTES_DEFAULT_ACTIVE_ID } from "#constants";

function useIsMobileMd() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return isMobile;
}

function NoteBody({ text }) {
  return (
    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white/85 font-sans">
      {text}
    </pre>
  );
}

export default function NotesApp({ resumeUrl = null }) {
  const isMobile = useIsMobileMd();

  const notes = useMemo(() => {
    return (NOTES_DATA || []).map((n) => ({
      id: n.id,
      title: n.title ?? n.id,
      date: n.date ?? "",
      body: n.body ?? "",
    }));
  }, []);

  const defaultId = NOTES_DEFAULT_ACTIVE_ID || (notes[0]?.id ?? null);

  const [selectedId, setSelectedId] = useState(isMobile ? null : defaultId);

  useEffect(() => {
    setSelectedId(isMobile ? null : defaultId);
  }, [isMobile, defaultId]);

  const selected = notes.find((n) => n.id === selectedId) || null;

  const showResumeButton =
    !!resumeUrl &&
    !!selected &&
    typeof selected.body === "string" &&
    selected.body.toLowerCase().includes("resume");

  /* ======================
     Mobile: LIST -> DETAIL
     ====================== */
  if (isMobile) {
    if (!selected) {
      return (
        <div className="h-full w-full text-white">
          <div className="px-3 py-2 border-b border-white/10 bg-black/20">
            <div className="text-sm text-white/90">Notes</div>
          </div>

          <div className="p-3">
            <div className="space-y-2">
              {notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className="w-full text-left rounded-2xl border border-white/10 bg-black/20 px-3 py-3 hover:bg-white/10 active:scale-[0.99] transition"
                >
                  <div className="text-sm font-medium text-white/95">
                    {n.title}
                  </div>
                  <div className="mt-0.5 text-xs text-white/65">
                    {n.date || " "}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full text-white">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/20">
          <button
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/90 hover:bg-white/10 active:scale-[0.99] transition"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="ml-1 text-sm text-white/90">{selected.title}</div>
        </div>

        <div className="p-3 space-y-3">
          <NoteBody text={selected.body} />

          {showResumeButton && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white/95 hover:bg-white/15 active:scale-[0.99] transition"
            >
              <FileText className="h-4 w-4" />
              Open Resume
            </a>
          )}
        </div>
      </div>
    );
  }

  /* ==========================
     Desktop: SIDEBAR + DETAIL
     ========================== */
  return (
    <div className="h-full w-full flex text-white">
      <div className="w-[240px] shrink-0 border-r border-white/10 bg-black/10">
        <div className="px-3 py-2 border-b border-white/10">
          <div className="text-sm text-white/90">Notes</div>
        </div>

        <div className="p-2 space-y-1">
          {notes.map((n) => {
            const active = n.id === selectedId;
            return (
              <button
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                className={[
                  "w-full text-left rounded-xl px-3 py-2 border transition",
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-transparent text-white/85 hover:border-white/10 hover:bg-white/5",
                ].join(" ")}
              >
                <div className="text-sm font-medium text-white/95">{n.title}</div>
                <div className="mt-0.5 text-xs text-white/60">{n.date || " "}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {selected ? <NoteBody text={selected.body} /> : null}

        {showResumeButton && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white/95 hover:bg-white/15 active:scale-[0.99] transition"
          >
            <FileText className="h-4 w-4" />
            Open Resume
          </a>
        )}
      </div>
    </div>
  );
}
