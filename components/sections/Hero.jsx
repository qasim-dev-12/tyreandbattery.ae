import { Clock, ShieldCheck, Wrench, Truck, CheckCircle2 } from "lucide-react";

const ICONS = { Clock, ShieldCheck, Wrench, Truck };

export default function Hero({ site }) {
  const { hero } = site;
  const telHref = `tel:${site.phone}`;
  const waHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    site.whatsappPrefilledText
  )}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:py-20">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-dark sm:text-4xl">
            {hero.titleLine1}
            <br />
            <span className="text-primary">{hero.titleLine2}</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-dark/60 sm:text-lg">{hero.subtext}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {hero.trustBadges.map((badge) => {
              const Icon = ICONS[badge.icon] ?? CheckCircle2;
              return (
                <div
                  key={badge.text}
                  className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-dark/70 shadow-sm"
                >
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {badge.text}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <ul className="flex flex-col gap-3">
            {hero.checklist.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-semibold text-dark">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full bg-green-500 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-green-600"
            >
              Chat on WhatsApp
            </a>
            <a
              href={telHref}
              className="flex-1 rounded-full border-2 border-primary px-5 py-3 text-center text-sm font-semibold text-primary hover:bg-primary hover:text-white"
            >
              Call {site.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {/* Thin gradient line along the hero's bottom edge */}
      <div className="h-1 bg-gradient-to-r from-primary via-blue-300 to-primary" />
    </section>
  );
}
