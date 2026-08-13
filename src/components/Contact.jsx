import { useMemo, useState } from "react";
import emailjs from "@emailjs/browser";
import { SITE } from "#constants";
import Reveal from "./Reveal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function canSendNow() {
  const key = "contact:lastSendAt";
  const last = Number(localStorage.getItem(key) || 0);
  const now = Date.now();
  if (now - last < 20_000) return { ok: false, waitMs: 20_000 - (now - last) };
  localStorage.setItem(key, String(now));
  return { ok: true, waitMs: 0 };
}

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    botcheck: "",
  });

  const [status, setStatus] = useState({ state: "idle", error: "" });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;

    if (form.botcheck) {
      setStatus({ state: "success", error: "" });
      setForm({ name: "", email: "", subject: "", message: "", botcheck: "" });
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
    <Reveal id="contact">
      <h2 className="section-heading">Contact</h2>
      <p className="mb-6 text-sm text-(--color-ink-soft)">
        Reach me directly at{" "}
        <a href={`mailto:${SITE.email}`} className="link-accent">
          {SITE.email}
        </a>
        , or send a message below.
      </p>

      {status.state === "success" && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Sent — thanks! I&apos;ll reply soon.
        </div>
      )}
      {status.state === "error" && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {status.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          type="text"
          name="botcheck"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          value={form.botcheck}
          onChange={setField("botcheck")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" placeholder="Your name" value={form.name} onChange={setField("name")} error={errors.name} />
          <Field label="Email" placeholder="you@example.com" value={form.email} onChange={setField("email")} error={errors.email} />
        </div>

        <Field label="Subject" placeholder="Collaboration / Question" value={form.subject} onChange={setField("subject")} error={errors.subject} />
        <Field label="Message" placeholder="Write your message here…" value={form.message} onChange={setField("message")} error={errors.message} textarea />

        <div className="mt-1 flex justify-end">
          <button
            type="submit"
            disabled={!canSend}
            className={[
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              canSend
                ? "bg-(--color-ink) text-(--color-paper) hover:bg-(--color-ink-soft)"
                : "cursor-not-allowed bg-(--color-line) text-(--color-ink-faint)",
            ].join(" ")}
          >
            {status.state === "sending" ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>
    </Reveal>
  );
}

function Field({ label, error, textarea = false, ...props }) {
  const Base = textarea ? "textarea" : "input";
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-(--color-ink-soft)">{label}</span>
      <Base
        {...props}
        className={[
          "w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm text-(--color-ink) outline-none",
          "placeholder:text-(--color-ink-faint) focus:border-(--color-ink-soft)",
          textarea ? "min-h-[120px] resize-none" : "",
        ].join(" ")}
      />
      <span className="min-h-[14px] text-xs text-rose-600">{error || ""}</span>
    </label>
  );
}
