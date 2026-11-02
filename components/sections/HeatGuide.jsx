import { Sun } from "lucide-react";

export default function HeatGuide({ site }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-col gap-6 rounded-2xl bg-gradient-to-br from-blue-50 to-white p-8 sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sun className="h-7 w-7 text-primary" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-dark">How {site.city} Heat Affects Your Battery</h2>
          <p className="mt-2 max-w-3xl text-sm text-dark/70">
            High temperatures speed up the chemical reactions inside a car battery, which shortens its
            working life and can cause it to fail without much warning. Batteries in hot climates like{" "}
            {site.city} often need replacing sooner than the official rating suggests — that's why we
            recommend a free check every summer, even if the car starts fine.
          </p>
        </div>
      </div>
    </section>
  );
}
