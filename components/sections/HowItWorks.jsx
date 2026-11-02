import { PhoneCall, MapPinned, Wrench, ThumbsUp } from "lucide-react";

const STEPS = [
  { icon: PhoneCall, title: "Book", text: "Call, WhatsApp, or submit the quote form with your location." },
  { icon: MapPinned, title: "We Dispatch", text: "A technician heads your way, usually within 30 minutes." },
  { icon: Wrench, title: "Test & Replace", text: "Free diagnostic first, then the battery is swapped on the spot." },
  { icon: ThumbsUp, title: "Drive Away", text: "Old battery disposed of safely, new one backed by warranty." },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">How It Works</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="relative rounded-xl border border-dark/10 bg-white p-6">
            <span className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {i + 1}
            </span>
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="mt-3 font-bold text-dark">{title}</h3>
            <p className="mt-1 text-sm text-dark/60">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
