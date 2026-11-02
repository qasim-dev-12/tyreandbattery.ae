import Link from "next/link";
import { MapPin, Clock, BatteryCharging, Info } from "lucide-react";
import { getAllAreas, getAreaBySlug } from "@/lib/areas";
import { getAllBatteries, getBatteryBySlug } from "@/lib/batteries";
import { isBatteryIndexable, getBatteryComboNote } from "@/lib/combos";
import { getFaqs, selectFaqsForArea, selectFaqsForBattery } from "@/lib/faqs";
import { getSite } from "@/lib/site";
import { pickVariant } from "@/lib/templateVariant";
import { buildBreadcrumbJsonLd, buildServiceJsonLd, buildFaqJsonLd } from "@/lib/jsonld";
import BatterySpecCard from "@/components/battery/BatterySpecCard";

// Tier 3 (service x area x battery) combo page, shared across every
// service. `cap` controls pre-render count — car-battery-replacement keeps
// its existing full pre-render (cap omitted); new services cap at 1,000
// (docs/SERVICE-PERMUTATION.md).
export async function generateStaticParamsForAreaBatteryCombos({ cap } = {}) {
  const [batteries, areas] = await Promise.all([getAllBatteries(), getAllAreas()]);
  if (!cap) {
    const params = [];
    for (const area of areas) {
      for (const battery of batteries) {
        params.push({ area: area.slug, battery: battery.slug });
      }
    }
    return params;
  }
  const ranked = [];
  for (const area of areas) {
    for (const battery of batteries) {
      ranked.push({ area, battery, score: area.demand * battery.rating });
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, cap).map(({ area, battery }) => ({ area: area.slug, battery: battery.slug }));
}

export async function areaBatteryComboMetadata(service, params) {
  const { area: areaSlug, battery: batterySlug } = params;
  const [area, battery] = await Promise.all([getAreaBySlug(areaSlug), getBatteryBySlug(batterySlug)]);
  if (!area || !battery) return {};

  const site = await getSite();
  const indexable = await isBatteryIndexable(service.slug, battery, area);
  const path = `/${service.slug}/${area.slug}/battery/${battery.slug}`;

  const metadata = {
    title: `${battery.name} — ${service.name} in ${area.name} | ${site.businessName}`,
    description: `Need ${service.name.toLowerCase()} involving a ${battery.name} in ${area.name}? Average response ${area.responseMinutes} minutes.`,
    alternates: { canonical: path },
  };

  if (!indexable) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

function introFor(service, area, battery) {
  const [landmark1] = area.landmarks;
  const variant = pickVariant(`${service.slug}__${area.slug}__battery__${battery.slug}`, 3);
  if (variant === 0) {
    return `Need ${service.name.toLowerCase()} involving a ${battery.name} in ${area.name}? We carry it in stock and can reach ${landmark1} within about ${area.responseMinutes} minutes.`;
  }
  if (variant === 1) {
    return `${area.name} drivers with a ${battery.type} battery like the ${battery.name} (${battery.capacityAh}Ah, ${battery.cca} CCA) call us for ${service.name.toLowerCase()} — average response time in ${area.name} is ${area.responseMinutes} minutes.`;
  }
  return `Stuck near ${landmark1} in ${area.name}? The ${battery.name} is in stock and backed by a ${battery.warrantyMonths}-month warranty — we offer ${service.name.toLowerCase()} and can be there in roughly ${area.responseMinutes} minutes.`;
}

export async function AreaBatteryComboPage(service, params) {
  const { area: areaSlug, battery: batterySlug } = params;
  const [area, battery] = await Promise.all([getAreaBySlug(areaSlug), getBatteryBySlug(batterySlug)]);
  if (!area || !battery) return null;

  const [comboNote, allFaqs, site] = await Promise.all([
    getBatteryComboNote(service.slug, area.slug, battery.slug),
    getFaqs(),
    getSite(),
  ]);

  const faqPool = [...selectFaqsForArea(allFaqs, area), ...selectFaqsForBattery(allFaqs, battery)];
  const seen = new Set();
  const faqs = faqPool.filter((f) => {
    if (seen.has(f.question)) return false;
    seen.add(f.question);
    return true;
  }).slice(0, 5);

  const basePath = `/${service.slug}`;
  const areaPath = `${basePath}/${area.slug}`;
  const batteryPath = `${basePath}/battery/${battery.slug}`;
  const path = `${areaPath}/battery/${battery.slug}`;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: service.name, path: basePath },
    { name: area.name, path: areaPath },
    { name: battery.name, path },
  ]);
  const serviceJsonLd = buildServiceJsonLd({
    name: `${battery.name} — ${service.name} in ${area.name}`,
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
        &gt; <span className="text-dark">{battery.name}</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">
        {battery.name} — {service.name} in {area.name}
      </h1>
      <p className="mt-4 max-w-3xl text-dark/70">{introFor(service, area, battery)}</p>

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
            <p className="text-xs text-dark/50">Battery type &amp; capacity</p>
            <p className="text-sm font-semibold text-dark">{battery.type}, {battery.capacityAh}Ah</p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-dark">{battery.name}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <BatterySpecCard battery={battery} />
        </div>
      </section>

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
          href={batteryPath}
          className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
        >
          More about the {battery.name}
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
