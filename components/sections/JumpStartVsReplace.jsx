import { CheckCircle2, XCircle } from "lucide-react";

export default function JumpStartVsReplace() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">Jump Start or Replace?</h2>
      <p className="mt-1 max-w-2xl text-sm text-dark/60">
        A jump start gets you moving, but it isn't always a fix. Here's how to tell the difference.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-dark/10 bg-white p-6">
          <h3 className="font-bold text-dark">A jump start is probably enough if…</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-dark/70">
            {[
              "The battery is under 3 years old",
              "It only died once, after lights were left on",
              "The engine cranks normally once jumped",
            ].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-dark/10 bg-white p-6">
          <h3 className="font-bold text-dark">You likely need a replacement if…</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-dark/70">
            {[
              "It's died more than once in the last month",
              "The battery is 3+ years old",
              "It struggles to crank even right after a jump",
            ].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
