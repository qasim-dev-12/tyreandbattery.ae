import Link from "next/link";
import { BatteryCharging, Zap, ShieldCheck } from "lucide-react";
import { getAllBatteries, getBatteryBySlug } from "@/lib/batteries";
import { getBrandByName } from "@/lib/brands";
import { getCarSlugsForBattery } from "@/lib/compat";
import { getAllCars } from "@/lib/cars";
import { getTopAreas } from "@/lib/areas";
import { isBatteryIndexableSync, getComboNotes } from "@/lib/combos";
import { getFaqs, selectFaqsForBattery } from "@/lib/faqs";
import { getSite } from "@/lib/site";
import { pickVariant } from "@/lib/templateVariant";
import { buildBreadcrumbJsonLd, buildServiceJsonLd, buildFaqJsonLd } from "@/lib/jsonld";

// Tier 2 (service x battery) page, shared across every service — docs/SERVICE-PERMUTATION.md.
export async function generateStaticParamsForBatteries() {
  const batteries = await getAllBatteries();
  return batteries.map((b) => ({ battery: b.slug }));
}

export async function batteryPageMetadata(service, params) {
  const { battery: batterySlug } = params;
  const battery = await getBatteryBySlug(batterySlug);
  if (!battery) return {};

  const site = await getSite();
  return {
    title: `${battery.name} — ${service.name} | ${site.businessName}`,
    description: `${service.shortDescription} For the ${battery.name} (${battery.capacityAh}Ah, ${battery.type}), in ${site.city}.`,
    alternates: { canonical: `/${service.slug}/battery/${battery.slug}` },
  };
}

function introFor(service, battery) {
  const variant = pickVariant(`${service.slug}__${battery.slug}`, 3);
  if (variant === 0) {
    return `The ${battery.name} is a ${battery.capacityAh}Ah ${battery.type} battery with ${battery.cca} CCA, rated ${battery.rating}/5 by customers. ${service.shortDescription}`;
  }
  if (variant === 1) {
    return `Need ${service.name.toLowerCase()} involving a ${battery.name}? It carries a ${battery.warrantyMonths}-month warranty and ${battery.cca} cold-cranking amps, and we handle it on-site with no workshop visit needed.`;
  }
  return `With ${battery.stock} units currently in stock, the ${battery.name} is ready for ${service.name.toLowerCase()} the same day — a ${battery.type} battery backed by a ${battery.warrantyMonths}-month warranty.`;
}

export async function BatteryPage(service, params) {
  const { battery: batterySlug } = params;
  const battery = await getBatteryBySlug(batterySlug);
  if (!battery) return null;

  const [brand, compatCarSlugs, allCars, topAreas, comboNotes, allFaqs, site] = await Promise.all([
    getBrandByName(battery.brand),
    getCarSlugsForBattery(battery.id),
    getAllCars(),
    getTopAreas(6),
    getComboNotes(),
    getFaqs(),
    getSite(),
  ]);

  const compatCarSet = new Set(compatCarSlugs);
  const compatibleCars = allCars.filter((c) => compatCarSet.has(c.slug)).slice(0, 8);
  const faqs = selectFaqsForBattery(allFaqs, battery);
  const basePath = `/${service.slug}`;
  const path = `${basePath}/battery/${battery.slug}`;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: service.name, path: basePath },
    { name: battery.name, path },
  ]);
  const serviceJsonLd = buildServiceJsonLd({
    name: `${battery.name} — ${service.name}`,
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
        &gt; <span className="text-dark">{battery.name}</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">
        {battery.name} — {service.name}
      </h1>
      <p className="mt-4 max-w-3xl text-dark/70">{introFor(service, battery)}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <BatteryCharging className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Type &amp; capacity</p>
            <p className="text-sm font-semibold text-dark">{battery.type}, {battery.capacityAh}Ah</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Cold-cranking amps</p>
            <p className="text-sm font-semibold text-dark">{battery.cca} CCA</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Warranty</p>
            <p className="text-sm font-semibold text-dark">{battery.warrantyMonths} months</p>
          </div>
        </div>
      </div>

      {brand && (
        <p className="mt-6 text-sm text-dark/70">
          Made by{" "}
          <Link href={`/brand/${brand.slug}`} className="font-semibold text-primary hover:underline">
            {brand.name}
          </Link>{" "}
          — {brand.warrantyMonths}-month standard brand warranty.
        </p>
      )}

      {compatibleCars.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">Cars this battery fits</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {compatibleCars.map((car) => (
              <Link
                key={car.slug}
                href={`${basePath}/car/${car.slug}`}
                className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
              >
                {car.name}
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
              const indexable = isBatteryIndexableSync(service.slug, battery, area, comboNotes);
              const href = indexable ? `${basePath}/${area.slug}/battery/${battery.slug}` : `${basePath}/${area.slug}`;
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
