// src/components/ContactApp.jsx
import React, { useMemo, useState } from "react";
import { TERMINAL_PROFILE, SOCIAL_LINKS } from "#constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactApp({ onClose }) {
  const toEmail =
    TERMINAL_PROFILE.contactEmail ||
    TERMINAL_PROFILE.email ||
    "om@example.com"; // fallback

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState({
    state: "idle", // idle | sending | success | error
    error: "",
  });

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email.";
    if (!form.subject.trim()) e.subject = "Subject is required.";
    if (!form.message.trim()) e.message = "Message is required.";
    else if (form.message.trim().length < 15)
      e.message = "Message should be at least 15 characters.";
    return e;
  }, [form]);

  const canSend = status.state !== "sending" && Object.keys(errors).length === 0;

  const setField = (k) => (e) => {
    const v = e.target.value;
    setForm((p) => ({ ...p, [k]: v }));
    if (status.state !== "idle") setStatus({ state: "idle", error: "" });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(toEmail);
      setStatus({ state: "success", error: "" });
      setTimeout(() => setStatus({ state: "idle", error: "" }), 1200);
    } catch {
      // ignore
    }
  };

  const open = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;

    setStatus({ state: "sending", error: "" });

    try {
      const mailto = new URL(`mailto:${toEmail}`);
      mailto.searchParams.set(
        "subject",
        `${form.subject} — from ${form.name}`
      );
      mailto.searchParams.set(
        "body",
        `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}\n`
      );

      // small UX delay
      await new Promise((r) => setTimeout(r, 350));

      // practical “send” without backend: opens user’s mail client draft
      window.location.href = mailto.toString();

      setStatus({ state: "success", error: "" });
    } catch {
      setStatus({
        state: "error",
        error: "Could not open email client. Please try again.",
      });
    }
  };

  const reset = () => {
    setForm({ name: "", email: "", subject: "", message: "" });
    setStatus({ state: "idle", error: "" });
  };

  return (
    <div className="h-full w-full">
      <div className="h-full w-full rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white/90">Contact</div>
            <div className="text-xs text-white/60">
              Send me a message — I’ll get back to you.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyEmail}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15"
              type="button"
              title={`Copy ${toEmail}`}
            >
              Copy email
            </button>

            {!!SOCIAL_LINKS?.github && (
              <button
                onClick={() => open(SOCIAL_LINKS.github)}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15"
                type="button"
              >
                GitHub
              </button>
            )}

            {!!SOCIAL_LINKS?.linkedin && (
              <button
                onClick={() => open(SOCIAL_LINKS.linkedin)}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15"
                type="button"
              >
                LinkedIn
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15"
                type="button"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {status.state === "success" && (
          <div className="mb-3 rounded-lg border border-emerald-400/15 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            Done — your email draft is ready.
          </div>
        )}
        {status.state === "error" && (
          <div className="mb-3 rounded-lg border border-rose-400/15 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {status.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid h-[calc(100%-72px)] gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Your name"
              placeholder="Om Gandhi"
              value={form.name}
              onChange={setField("name")}
              error={errors.name}
            />
            <Field
              label="Your email"
              placeholder="you@example.com"
              value={form.email}
              onChange={setField("email")}
              error={errors.email}
            />
          </div>

          <Field
            label="Subject"
            placeholder="Internship / Collaboration / Question"
            value={form.subject}
            onChange={setField("subject")}
            error={errors.subject}
          />

          <Field
            label="Message"
            placeholder="Write your message here…"
            value={form.message}
            onChange={setField("message")}
            error={errors.message}
            textarea
          />

          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="text-[11px] text-white/50">
              Sends via your mail client (mailto). We can wire a backend next.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/15"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={!canSend}
                className={[
                  "rounded-lg px-4 py-2 text-xs font-medium",
                  "border border-white/10",
                  canSend
                    ? "bg-white/20 text-white hover:bg-white/25"
                    : "bg-white/5 text-white/40 cursor-not-allowed",
                ].join(" ")}
              >
                {status.state === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, textarea = false, ...props }) {
  const Base = textarea ? "textarea" : "input";
  return (
    <label className="grid gap-1">
      <span className="text-[11px] text-white/70">{label}</span>
      <Base
        {...props}
        className={[
          "w-full rounded-xl border px-3 py-2 text-sm text-white/90",
          "border-white/10 bg-white/5 outline-none",
          "placeholder:text-white/35",
          "focus:border-white/25 focus:bg-white/10",
          textarea ? "min-h-[140px] resize-none" : "",
        ].join(" ")}
      />
      <span className="min-h-[14px] text-[11px] text-rose-300/90">
        {error || ""}
      </span>
    </label>
  );
}
