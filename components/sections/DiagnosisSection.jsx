import { Gauge, Zap, Cable, Thermometer } from "lucide-react";

const CHECKS = [
  { icon: Gauge, title: "Voltage test", text: "We measure resting and cranking voltage to confirm the battery is actually at fault." },
  { icon: Zap, title: "Load test", text: "A load tester checks whether the battery can hold charge under real engine demand." },
  { icon: Cable, title: "Terminal & cable check", text: "Corrosion or a loose connection can mimic a dead battery — we rule that out first." },
  { icon: Thermometer, title: "Alternator check", text: "We confirm the alternator is charging properly so a new battery doesn't drain again." },
];

export default function DiagnosisSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">Our Free Diagnostic Check</h2>
      <p className="mt-1 max-w-2xl text-sm text-dark/60">
        Before we recommend a replacement, every visit includes this quick check — at no charge.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {CHECKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-4 rounded-xl border border-dark/10 bg-white p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold text-dark">{title}</h3>
              <p className="mt-1 text-sm text-dark/60">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
