"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

const PHONE_PATTERN = /^[+\d][\d\s-]{6,19}$/;

function validate(values) {
  const errors = {};
  if (!values.name.trim() || values.name.trim().length < 2) {
    errors.name = "Enter your name.";
  }
  if (!values.phone.trim() || !PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!values.location.trim()) {
    errors.location = "Enter your location.";
  }
  return errors;
}

// `car` is accepted for future car-specific pages (Phase 7/8) to prefill as
// hidden intent context — the area is already implicit in `source` (the
// page path), so no separate area field is needed in leads.json.
export default function ContactForm({ car = null }) {
  const pathname = usePathname();
  const [values, setValues] = useState({ name: "", phone: "", location: "", honeypot: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [serverError, setServerError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("submitting");
    setServerError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          phone: values.phone.trim(),
          location: values.location.trim(),
          honeypot: values.honeypot,
          car,
          source: pathname,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFieldErrors(data.fields || {});
        setServerError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setValues({ name: "", phone: "", location: "", honeypot: "" });
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
        <p className="font-semibold text-dark">Thanks! We'll call you shortly.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Honeypot: invisible to real users, but a plain form field a bot's
          auto-fill will often populate. If filled, the API silently drops it. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          type="text"
          id="company"
          name="honeypot"
          tabIndex={-1}
          autoComplete="off"
          value={values.honeypot}
          onChange={handleChange}
        />
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-dark/70">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          className="w-full rounded-md border border-dark/20 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-dark/70">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={values.phone}
          onChange={handleChange}
          className="w-full rounded-md border border-dark/20 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
      </div>

      <div>
        <label htmlFor="location" className="mb-1 block text-sm font-medium text-dark/70">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={values.location}
          onChange={handleChange}
          className="w-full rounded-md border border-dark/20 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {fieldErrors.location && <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {status === "submitting" ? "Sending..." : "Get My Free Quote"}
      </button>
    </form>
  );
}
