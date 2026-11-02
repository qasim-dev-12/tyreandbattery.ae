import Link from "next/link";
import { MapPin, Clock, BatteryCharging, Info } from "lucide-react";
import { getAllAreas, getAreaBySlug } from "@/lib/areas";
import { getAllCars, getCarBySlug } from "@/lib/cars";
import { getCompatibleBatteries } from "@/lib/compat";
import { isIndexable, getComboNote, rankCombos } from "@/lib/combos";
import { getFaqs, selectFaqsForArea, selectFaqsForCar } from "@/lib/faqs";
import { getSite } from "@/lib/site";
import { pickVariant } from "@/lib/templateVariant";
import { buildBreadcrumbJsonLd, buildServiceJsonLd, buildFaqJsonLd } from "@/lib/jsonld";
import BatterySpecCard from "@/components/battery/BatterySpecCard";

// Tier 3 (service x area x car) combo page, shared across every service.
// `cap` controls how many of the ranked combos are pre-rendered at build
// time — docs/SERVICE-PERMUTATION.md keeps car-battery-replacement's
// existing cap (1,000) and uses the same cap for new services.
export async function generateStaticParamsForAreaCarCombos({ cap } = {}) {
  const [cars, areas] = await Promise.all([getAllCars(), getAllAreas()]);
  const ranked = rankCombos(cars, areas);
  const list = cap ? ranked.slice(0, cap) : ranked;
  return list.map(({ area, car }) => ({ area: area.slug, car: car.slug }));
}

export async function areaCarComboMetadata(service, params) {
  const { area: areaSlug, car: carSlug } = params;
  const [area, car] = await Promise.all([getAreaBySlug(areaSlug), getCarBySlug(carSlug)]);
  if (!area || !car) return {};

  const site = await getSite();
  const indexable = await isIndexable(service.slug, car, area);
  const path = `/${service.slug}/${area.slug}/${car.slug}`;

  const metadata = {
    title: `${car.name} ${service.name} in ${area.name} | ${site.businessName}`,
    description: `Need ${service.name.toLowerCase()} for your ${car.name} in ${area.name}? Average response ${area.responseMinutes} minutes.`,
    alternates: { canonical: path },
  };

  if (!indexable) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

function introFor(service, area, car) {
  const [landmark1] = area.landmarks;
  const [issue1] = car.commonIssues;
  const variant = pickVariant(`${service.slug}__${area.slug}__${car.slug}`, 3);
  if (variant === 0) {
    return `Need ${service.name.toLowerCase()} for your ${car.name} in ${area.name}? We carry ${car.batteryType} batteries compatible with this model and can reach ${landmark1} within about ${area.responseMinutes} minutes.`;
  }
  if (variant === 1) {
    return `${area.name} drivers with a ${car.make} ${car.model} often deal with ${issue1}. Our mobile team handles ${service.name.toLowerCase()} and comes to you — average response time in ${area.name} is ${area.responseMinutes} minutes.`;
  }
  return `Stuck with a ${car.name} issue near ${landmark1} in ${area.name}? We offer ${service.name.toLowerCase()} and can be there in roughly ${area.responseMinutes} minutes.`;
}

export async function AreaCarComboPage(service, params) {
  const { area: areaSlug, car: carSlug } = params;
  const [area, car] = await Promise.all([getAreaBySlug(areaSlug), getCarBySlug(carSlug)]);
  if (!area || !car) return null;

  const [compatibleBatteries, comboNote, allFaqs, site] = await Promise.all([
    getCompatibleBatteries(car.slug),
    getComboNote(service.slug, area.slug, car.slug),
    getFaqs(),
    getSite(),
  ]);

  const faqPool = [...selectFaqsForArea(allFaqs, area), ...selectFaqsForCar(allFaqs, car)];
  const seen = new Set();
  const faqs = faqPool.filter((f) => {
    if (seen.has(f.question)) return false;
    seen.add(f.question);
    return true;
  }).slice(0, 5);

  const basePath = `/${service.slug}`;
  const areaPath = `${basePath}/${area.slug}`;
  const carPath = `${basePath}/car/${car.slug}`;
  const path = `${areaPath}/${car.slug}`;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: service.name, path: basePath },
    { name: area.name, path: areaPath },
    { name: car.name, path },
  ]);
  const serviceJsonLd = buildServiceJsonLd({
    name: `${service.name} for ${car.name} in ${area.name}`,
    areaServed: area.name,
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
        &gt;{" "}
        <Link href={areaPath} className="hover:text-primary">{area.name}</Link>{" "}
        &gt; <span className="text-dark">{car.name}</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">
        {car.name} {service.name} in {area.name}
      </h1>
      <p className="mt-4 max-w-3xl text-dark/70">{introFor(service, area, car)}</p>

      {comboNote && (
        <div className="mt-4 flex gap-3 rounded-lg border border-primary/20 bg-blue-50 p-4">
          <Info className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-dark/70">{comboNote}</p>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Response time in {area.name}</p>
            <p className="text-sm font-semibold text-dark">~{area.responseMinutes} minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Landmarks nearby</p>
            <p className="text-sm font-semibold text-dark">{area.landmarks.join(", ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <BatteryCharging className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Battery type for this model</p>
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
      </div>

      {compatibleBatteries.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">
            Compatible batteries for your {car.name}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {compatibleBatteries.map((battery) => (
              <BatterySpecCard key={battery.id} battery={battery} />
            ))}
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

      <div className="mt-10 flex flex-wrap gap-3 border-t border-dark/10 pt-6">
        <Link
          href={areaPath}
          className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
        >
          View all services in {area.name}
        </Link>
        <Link
          href={carPath}
          className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
        >
          More about the {car.name}
        </Link>
        <Link
          href={basePath}
          className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
        >
          {service.name} home
        </Link>
      </div>
    </div>
  );
}
