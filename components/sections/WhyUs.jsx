import { Clock, ShieldCheck, Wrench, Truck, CheckCircle2 } from "lucide-react";

const ICONS = { Clock, ShieldCheck, Wrench, Truck };

export default function WhyUs({ site }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">Why Choose {site.businessName}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {site.trustBadges.map((badge) => {
          const Icon = ICONS[badge.icon] ?? CheckCircle2;
          return (
            <div
              key={badge.text}
              className="flex flex-col items-center gap-3 rounded-xl border border-dark/10 bg-white p-6 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </span>
              <p className="font-semibold text-dark">{badge.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
