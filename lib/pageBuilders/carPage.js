import Link from "next/link";
import { BatteryCharging, Zap, AlertTriangle } from "lucide-react";
import { getAllCars, getCarBySlug, getRelatedCars } from "@/lib/cars";
import { getCompatibleBatteries } from "@/lib/compat";
import { getTopAreas } from "@/lib/areas";
import { isIndexableSync, getComboNotes } from "@/lib/combos";
import { getFaqs, selectFaqsForCar } from "@/lib/faqs";
import { getSite } from "@/lib/site";
import { pickVariant } from "@/lib/templateVariant";
import { buildBreadcrumbJsonLd, buildServiceJsonLd, buildFaqJsonLd } from "@/lib/jsonld";
import BatterySpecCard from "@/components/battery/BatterySpecCard";

// Tier 2 (service x car) page, shared across every service — docs/SERVICE-PERMUTATION.md.
export async function generateStaticParamsForCars() {
  const cars = await getAllCars();
  return cars.map((c) => ({ car: c.slug }));
}

export async function carPageMetadata(service, params) {
  const { car: carSlug } = params;
  const car = await getCarBySlug(carSlug);
  if (!car) return {};

  const site = await getSite();
  return {
    title: `${car.name} ${service.name} | ${site.businessName}`,
    description: `${service.shortDescription} For the ${car.name}, in ${site.city}.`,
    alternates: { canonical: `/${service.slug}/car/${car.slug}` },
  };
}

function introFor(service, car) {
  const [issue1, issue2] = car.commonIssues;
  const variant = pickVariant(`${service.slug}__${car.slug}`, 3);
  if (variant === 0) {
    return `The ${car.name} is one of the most common cars we service for issues like ${issue1}. If yours is showing those signs, our team can help on-site with ${service.name.toLowerCase()}.`;
  }
  if (variant === 1) {
    return `Owners of the ${car.make} ${car.model} (${car.yearFrom}–${car.yearTo}) often come to us with ${issue1}${issue2 ? ` or ${issue2}` : ""}. ${service.shortDescription}`;
  }
  return `Does your ${car.name} struggle with ${issue1}? That's one of the most common complaints we hear about this model — ${service.name.toLowerCase()} usually resolves it at your location.`;
}

export async function CarPage(service, params) {
  const { car: carSlug } = params;
  const car = await getCarBySlug(carSlug);
  if (!car) return null;

  const [compatibleBatteries, relatedCars, topAreas, allFaqs, comboNotes, site] = await Promise.all([
    getCompatibleBatteries(car.slug),
    getRelatedCars(car, 4),
    getTopAreas(6),
    getFaqs(),
    getComboNotes(),
    getSite(),
  ]);

  const faqs = selectFaqsForCar(allFaqs, car);
  const compatMapForThisCar = { [car.slug]: compatibleBatteries.map((b) => b.id) };
  const basePath = `/${service.slug}`;
  const path = `${basePath}/car/${car.slug}`;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: service.name, path: basePath },
    { name: car.name, path },
  ]);
  const serviceJsonLd = buildServiceJsonLd({
    name: `${service.name} for ${car.name}`,
    areaServed: site.city,
    provider: site.businessName,
    url: path,
  });
  const faqJsonLd = buildFaqJsonLd(faqs);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <nav aria-label="Breadcrumb" className="text-sm text-dark/50">
        <Link href="/" className="hover:text-primary">Home</Link>{" "}
        &gt;{" "}
        <Link href={basePath} className="hover:text-primary">{service.name}</Link>{" "}
        &gt; <span className="text-dark">{car.name}</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">
        {service.name} for {car.name}
      </h1>
      <p className="mt-4 max-w-3xl text-dark/70">{introFor(service, car)}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <BatteryCharging className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Battery type</p>
            <p className="text-sm font-semibold text-dark">
              {car.batteryType}{" "}
              {!car.dataVerified && (
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  SAMPLE — verify
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Group size</p>
            <p className="text-sm font-semibold text-dark">
              {car.groupSize}{" "}
              {!car.dataVerified && (
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  SAMPLE — verify
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <AlertTriangle className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Start-stop system</p>
            <p className="text-sm font-semibold text-dark">
              {car.startStop ? "Yes" : "No"}{" "}
              {!car.dataVerified && (
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  SAMPLE — verify
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {car.commonIssues.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-dark">Common battery issues on this model</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-dark/70">
            {car.commonIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      )}

      {compatibleBatteries.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">Compatible batteries in stock</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {compatibleBatteries.map((battery) => (
              <BatterySpecCard key={battery.id} battery={battery} />
            ))}
          </div>
        </section>
      )}

      {relatedCars.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">Related vehicles</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedCars.map((related) => (
              <Link
                key={related.slug}
                href={`${basePath}/car/${related.slug}`}
                className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
              >
                {related.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {topAreas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">Areas we cover</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topAreas.map((area) => {
              const indexable = isIndexableSync(service.slug, car, area, compatMapForThisCar, comboNotes);
              const href = indexable ? `${basePath}/${area.slug}/${car.slug}` : `${basePath}/${area.slug}`;
              return (
                <Link
                  key={area.slug}
                  href={href}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {area.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">Frequently asked questions</h2>
          <div className="mt-3 flex flex-col divide-y divide-dark/10 rounded-xl border border-dark/10 bg-white">
            {faqs.map((faq) => (
              <div key={faq.question} className="p-4">
                <p className="font-semibold text-dark">{faq.question}</p>
                <p className="mt-1 text-sm text-dark/60">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
