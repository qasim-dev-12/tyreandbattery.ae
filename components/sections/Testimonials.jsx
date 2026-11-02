import { Star } from "lucide-react";

// Clearly-fake placeholder content — every card is tagged "Sample testimonial"
// so this is never mistaken for a real customer quote (docs/PHASES.md Phase 10).
const TESTIMONIALS = [
  { name: "Ahmed K.", rating: 5, text: "Technician arrived in under 30 minutes and swapped the battery right in the parking lot. Didn't expect it to be that fast." },
  { name: "Fatima R.", rating: 5, text: "Called in the morning, battery was replaced before lunch. Clear pricing, no surprises." },
  { name: "Daniel M.", rating: 4, text: "Good service overall. Had to wait a little longer than quoted but the job itself was quick and clean." },
  { name: "Sara A.", rating: 5, text: "They tested the battery for free first instead of just pushing a sale. Appreciated the honesty." },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">What Customers Say</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="flex flex-col gap-3 rounded-xl border border-dark/10 bg-white p-5">
            <span className="self-start rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Sample testimonial
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < t.rating ? "fill-primary text-primary" : "text-dark/20"}`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="text-sm text-dark/70">&ldquo;{t.text}&rdquo;</p>
            <p className="text-sm font-semibold text-dark">{t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
