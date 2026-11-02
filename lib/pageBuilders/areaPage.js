import Link from "next/link";
import { MapPin, Clock, ParkingSquare } from "lucide-react";
import { getAllAreas, getAreaBySlug, getNearbyAreas } from "@/lib/areas";
import { getAllCars } from "@/lib/cars";
import { getAllBatteries } from "@/lib/batteries";
import { getBrands } from "@/lib/brands";
import { getCompatMap } from "@/lib/compat";
import { isIndexableSync, isBatteryIndexableSync, isBrandIndexableSync, getComboNotes } from "@/lib/combos";
import { getFaqs, selectFaqsForArea } from "@/lib/faqs";
import { getSite } from "@/lib/site";
import { pickVariant } from "@/lib/templateVariant";
import { buildBreadcrumbJsonLd, buildServiceJsonLd, buildFaqJsonLd } from "@/lib/jsonld";

// Tier 1 (service x area) page, shared across every service in
// data/services.json — docs/SERVICE-PERMUTATION.md.
export async function generateStaticParamsForAreas() {
  const areas = await getAllAreas();
  return areas.map((a) => ({ area: a.slug }));
}

export async function areaPageMetadata(service, params) {
  const { area: areaSlug } = params;
  const area = await getAreaBySlug(areaSlug);
  if (!area) return {};

  const site = await getSite();
  return {
    title: `${service.name} in ${area.name}, ${area.city} | ${site.businessName}`,
    description: `${service.shortDescription} Available in ${area.name}, ${area.city}. Average response time ${area.responseMinutes} minutes.`,
    alternates: { canonical: `/${service.slug}/${area.slug}` },
  };
}

// Three structurally different intros (not a synonym swap) so area pages
// read as genuinely distinct content, not a templated mail-merge. Hashed by
// service slug too so the same area reads differently under each service.
function introFor(service, area) {
  const [landmark1, landmark2] = area.landmarks;
  const variant = pickVariant(`${service.slug}__${area.slug}`, 3);
  if (variant === 0) {
    return `Need ${service.name.toLowerCase()} in ${area.name}, ${area.city}? ${service.shortDescription} We reach ${area.name} in about ${area.responseMinutes} minutes on average, and ${landmark1} or ${landmark2} rarely slows us down. ${area.parkingNote}`;
  }
  if (variant === 1) {
    return `If you're parked near ${landmark1} or ${landmark2} in ${area.name}, ${service.name.toLowerCase()} doesn't have to wait. We dispatch a technician to ${area.name} within roughly ${area.responseMinutes} minutes. ${area.parkingNote}`;
  }
  return `${area.name} drivers call us for ${service.name.toLowerCase()} near ${landmark1} or anywhere else in the area. Average response time here is ${area.responseMinutes} minutes, and our vans are built for ${area.city}'s mix of parking styles. ${area.parkingNote}`;
}

export async function AreaPage(service, params) {
  const { area: areaSlug } = params;
  const area = await getAreaBySlug(areaSlug);
  if (!area) return null;

  const [allCars, allBatteries, allBrands, compatMap, comboNotes, nearbyAreas, allFaqs, site] = await Promise.all([
    getAllCars(),
    getAllBatteries(),
    getBrands(),
    getCompatMap(),
    getComboNotes(),
    getNearbyAreas(area, 4),
    getFaqs(),
    getSite(),
  ]);

  const topCars = allCars
    .filter((car) => (compatMap[car.slug]?.length ?? 0) > 0)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 6);

  const topBatteries = [...allBatteries]
    .filter((b) => b.stock > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
  const topBrands = [...allBrands].slice(0, 6);

  const faqs = selectFaqsForArea(allFaqs, area);
  const basePath = `/${service.slug}`;
  const path = `${basePath}/${area.slug}`;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: service.name, path: basePath },
    { name: area.name, path },
  ]);
  const serviceJsonLd = buildServiceJsonLd({
    name: `${service.name} in ${area.name}`,
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
        &gt; <span className="text-dark">{area.name}</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">
        {service.name} in {area.name}
      </h1>
      <p className="mt-4 max-w-3xl text-dark/70">{introFor(service, area)}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Response time</p>
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
          <ParkingSquare className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Parking</p>
            <p className="text-sm font-semibold text-dark">{area.parkingNote}</p>
          </div>
        </div>
      </div>

      {topCars.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">Popular cars we service in {area.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topCars.map((car) => {
              const indexable = isIndexableSync(service.slug, car, area, compatMap, comboNotes);
              const href = indexable ? `${basePath}/${area.slug}/${car.slug}` : `${basePath}/car/${car.slug}`;
              return (
                <Link
                  key={car.slug}
                  href={href}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {car.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {topBatteries.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">Featured batteries in {area.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topBatteries.map((battery) => {
              const indexable = isBatteryIndexableSync(service.slug, battery, area, comboNotes);
              const href = indexable
                ? `${basePath}/${area.slug}/battery/${battery.slug}`
                : `${basePath}/battery/${battery.slug}`;
              return (
                <Link
                  key={battery.slug}
                  href={href}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {battery.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {topBrands.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">Brands available in {area.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topBrands.map((brand) => {
              const indexable = isBrandIndexableSync(service.slug, brand, area, allBatteries, comboNotes);
              const href = indexable ? `${basePath}/${area.slug}/brand/${brand.slug}` : `/brand/${brand.slug}`;
              return (
                <Link
                  key={brand.slug}
                  href={href}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {brand.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {nearbyAreas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-dark">Nearby areas we cover</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {nearbyAreas.map((nearby) => (
              <Link
                key={nearby.slug}
                href={`${basePath}/${nearby.slug}`}
                className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
              >
                {nearby.name}
              </Link>
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
    </div>
  );
}
