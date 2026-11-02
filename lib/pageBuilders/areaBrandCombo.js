import Link from "next/link";
import { MapPin, Clock, ShieldCheck, Info } from "lucide-react";
import { getAllAreas, getAreaBySlug } from "@/lib/areas";
import { getBrands, getBrandBySlug } from "@/lib/brands";
import { getBatteriesByBrand } from "@/lib/batteries";
import { isBrandIndexable, getBrandComboNote } from "@/lib/combos";
import { getFaqs, selectFaqsForArea, selectFaqsForBrand } from "@/lib/faqs";
import { getSite } from "@/lib/site";
import { pickVariant } from "@/lib/templateVariant";
import { buildBreadcrumbJsonLd, buildServiceJsonLd, buildFaqJsonLd } from "@/lib/jsonld";
import BatterySpecCard from "@/components/battery/BatterySpecCard";

// Tier 3 (service x area x brand) combo page, shared across every service.
// `cap` controls pre-render count — car-battery-replacement keeps its
// existing full pre-render (cap omitted); new services cap at 500
// (docs/SERVICE-PERMUTATION.md).
export async function generateStaticParamsForAreaBrandCombos({ cap } = {}) {
  const [brands, areas] = await Promise.all([getBrands(), getAllAreas()]);
  if (!cap) {
    const params = [];
    for (const area of areas) {
      for (const brand of brands) {
        params.push({ area: area.slug, brand: brand.slug });
      }
    }
    return params;
  }
  const ranked = [];
  for (const area of areas) {
    for (const brand of brands) {
      ranked.push({ area, brand, score: area.demand });
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, cap).map(({ area, brand }) => ({ area: area.slug, brand: brand.slug }));
}

export async function areaBrandComboMetadata(service, params) {
  const { area: areaSlug, brand: brandSlug } = params;
  const [area, brand] = await Promise.all([getAreaBySlug(areaSlug), getBrandBySlug(brandSlug)]);
  if (!area || !brand) return {};

  const site = await getSite();
  const indexable = await isBrandIndexable(service.slug, brand, area);
  const path = `/${service.slug}/${area.slug}/brand/${brand.slug}`;

  const metadata = {
    title: `${brand.name} — ${service.name} in ${area.name} | ${site.businessName}`,
    description: `Need ${service.name.toLowerCase()} with a ${brand.name} battery in ${area.name}? Average response ${area.responseMinutes} minutes.`,
    alternates: { canonical: path },
  };

  if (!indexable) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

function introFor(service, area, brand, batteryCount) {
  const [landmark1] = area.landmarks;
  const variant = pickVariant(`${service.slug}__${area.slug}__brand__${brand.slug}`, 3);
  if (variant === 0) {
    return `Need ${service.name.toLowerCase()} with a ${brand.name} battery in ${area.name}? We stock ${batteryCount} ${brand.name} model${batteryCount === 1 ? "" : "s"} and can reach ${landmark1} within about ${area.responseMinutes} minutes.`;
  }
  if (variant === 1) {
    return `${area.name} drivers who choose ${brand.name} get a ${brand.warrantyMonths}-month warranty on every unit. Our mobile team handles ${service.name.toLowerCase()} — average response time in ${area.name} is ${area.responseMinutes} minutes.`;
  }
  return `Stuck near ${landmark1} in ${area.name}? We offer ${service.name.toLowerCase()} for ${brand.name} batteries, backed by a ${brand.warrantyMonths}-month warranty.`;
}

export async function AreaBrandComboPage(service, params) {
  const { area: areaSlug, brand: brandSlug } = params;
  const [area, brand] = await Promise.all([getAreaBySlug(areaSlug), getBrandBySlug(brandSlug)]);
  if (!area || !brand) return null;

  const [batteries, comboNote, allFaqs, site] = await Promise.all([
    getBatteriesByBrand(brand.name),
    getBrandComboNote(service.slug, area.slug, brand.slug),
    getFaqs(),
    getSite(),
  ]);

  const inStockBatteries = batteries.filter((b) => b.stock > 0);

  const faqPool = [...selectFaqsForArea(allFaqs, area), ...selectFaqsForBrand(allFaqs, brand)];
  const seen = new Set();
  const faqs = faqPool.filter((f) => {
    if (seen.has(f.question)) return false;
    seen.add(f.question);
    return true;
  }).slice(0, 5);

  const basePath = `/${service.slug}`;
  const areaPath = `${basePath}/${area.slug}`;
  const brandPath = `/brand/${brand.slug}`;
  const path = `${areaPath}/brand/${brand.slug}`;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: service.name, path: basePath },
    { name: area.name, path: areaPath },
    { name: brand.name, path },
  ]);
  const serviceJsonLd = buildServiceJsonLd({
    name: `${brand.name} — ${service.name} in ${area.name}`,
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
        &gt; <span className="text-dark">{brand.name}</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">
        {brand.name} — {service.name} in {area.name}
      </h1>
      <p className="mt-4 max-w-3xl text-dark/70">{introFor(service, area, brand, inStockBatteries.length)}</p>

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
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Brand warranty</p>
            <p className="text-sm font-semibold text-dark">{brand.warrantyMonths} months</p>
          </div>
        </div>
      </div>

      {inStockBatteries.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">{brand.name} batteries in stock</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {inStockBatteries.map((battery) => (
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
          href={brandPath}
          className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
        >
          More about {brand.name}
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
