// src/components/ContactApp.jsx
import React, { useMemo, useState } from "react";
import emailjs from "@emailjs/browser";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function canSendNow() {
  // Simple client-side rate limit: 1 send per 20 seconds
  const key = "contact:lastSendAt";
  const last = Number(localStorage.getItem(key) || 0);
  const now = Date.now();
  if (now - last < 20_000) return { ok: false, waitMs: 20_000 - (now - last) };
  localStorage.setItem(key, String(now));
  return { ok: true, waitMs: 0 };
}

export default function ContactApp({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    botcheck: "", // honeypot
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

  const reset = () => {
    setForm({ name: "", email: "", subject: "", message: "", botcheck: "" });
    setStatus({ state: "idle", error: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;

    // Honeypot triggered (bots)
    if (form.botcheck) {
      setStatus({ state: "success", error: "" });
      reset();
      return;
    }

    const env = {
      serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
      templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
    };

    if (!env.serviceId || !env.templateId || !env.publicKey) {
      setStatus({
        state: "error",
        error: "Email service is not configured (missing VITE_EMAILJS_* env vars).",
      });
      return;
    }

    const rate = canSendNow();
    if (!rate.ok) {
      setStatus({
        state: "error",
        error: `Please wait ${Math.ceil(rate.waitMs / 1000)}s before sending again.`,
      });
      return;
    }

    setStatus({ state: "sending", error: "" });

    try {
      // Template parameters (match your EmailJS template variables)
      const templateParams = {
        from_name: form.name.trim(),
        reply_to: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      };

      await emailjs.send(env.serviceId, env.templateId, templateParams, {
        publicKey: env.publicKey,
      });

      setStatus({ state: "success", error: "" });
      setForm({ name: "", email: "", subject: "", message: "", botcheck: "" });
    } catch (err) {
      console.error("EmailJS send error:", err);
      setStatus({
        state: "error",
        error: "Could not send message. Please try again in a moment.",
      });
    }
  };

  return (
    <div className="h-full w-full">
      <div className="h-full w-full rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl p-4 flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-white/90">Contact</div>
            <div className="text-xs text-white/60">Send me a message — it comes straight to my inbox.</div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 max-w-full">
            {onClose && (
              <button
                onClick={onClose}
                className="shrink-0 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15"
                type="button"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {status.state === "success" && (
          <div className="mb-3 rounded-lg border border-emerald-400/15 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            Sent — thanks! I’ll reply soon.
          </div>
        )}
        {status.state === "error" && (
          <div className="mb-3 rounded-lg border border-rose-400/15 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {status.error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Honeypot field (hidden) */}
          <input
            type="text"
            name="botcheck"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            value={form.botcheck}
            onChange={setField("botcheck")}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Your name" placeholder="Om Gandhi" value={form.name} onChange={setField("name")} error={errors.name} />
            <Field label="Your email" placeholder="you@example.com" value={form.email} onChange={setField("email")} error={errors.email} />
          </div>

          <Field label="Subject" placeholder="Internship / Collaboration / Question" value={form.subject} onChange={setField("subject")} error={errors.subject} />

          <Field label="Message" placeholder="Write your message here…" value={form.message} onChange={setField("message")} error={errors.message} textarea />

          <div className="mt-1 flex items-center justify-end gap-2">
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
                "rounded-lg px-4 py-2 text-xs font-medium border border-white/10",
                canSend ? "bg-white/20 text-white hover:bg-white/25" : "bg-white/5 text-white/40 cursor-not-allowed",
              ].join(" ")}
            >
              {status.state === "sending" ? "Sending…" : "Send"}
            </button>
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
          "border-white/10 bg-white/5 outline-none placeholder:text-white/35",
          "focus:border-white/25 focus:bg-white/10",
          textarea ? "min-h-[140px] resize-none" : "",
        ].join(" ")}
      />
      <span className="min-h-[14px] text-[11px] text-rose-300/90">{error || ""}</span>
    </label>
  );
}
