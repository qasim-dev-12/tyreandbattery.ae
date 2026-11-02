import { AlertTriangle, Lightbulb, Volume2, Gauge, CalendarClock } from "lucide-react";

const SIGNS = [
  { icon: Gauge, text: "Engine cranks slowly, especially in the morning" },
  { icon: Lightbulb, text: "Dashboard battery warning light is on" },
  { icon: Volume2, text: "A clicking sound when you turn the key" },
  { icon: AlertTriangle, text: "Headlights or interior lights look dim" },
  { icon: CalendarClock, text: "Your battery is 3 years old or older" },
];

export default function WarningSigns() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">Signs Your Battery Is Dying</h2>
      <p className="mt-1 max-w-2xl text-sm text-dark/60">
        Catching these early can save you from an unexpected breakdown.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SIGNS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-3 rounded-xl border border-dark/10 bg-white p-5">
            <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-dark/80">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
