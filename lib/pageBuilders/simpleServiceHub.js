import Link from "next/link";
import { Clock, ShieldCheck } from "lucide-react";
import { getSite } from "@/lib/site";
import { getTopAreas } from "@/lib/areas";
import { getTopCars } from "@/lib/cars";
import { getAllBatteries } from "@/lib/batteries";
import { getBrands } from "@/lib/brands";
import { getFaqs } from "@/lib/faqs";
import { buildBreadcrumbJsonLd, buildServiceJsonLd, buildFaqJsonLd } from "@/lib/jsonld";
import ContactForm from "@/components/sections/ContactForm";
import ServiceIcon from "@/components/ServiceIcon";

// Hub page for the 4 new services (docs/SERVICE-PERMUTATION.md). Deliberately
// lighter than car-battery-replacement's own hub (app/car-battery-replacement/page.js,
// not migrated to this builder) — that page's rich marketing sections (why
// us, warning signs, jump-start-vs-replace, battery types table, heat
// guide, testimonials) are specifically about battery replacement and
// wouldn't make sense reused verbatim for e.g. battery disposal. Reusing
// them anyway would also be duplicate content across 5 hub pages. This hub
// instead leans on the thing that's genuinely different per service: the
// real area/car/battery/brand links underneath it.
export async function simpleServiceHubMetadata(service) {
  const site = await getSite();
  return {
    title: `${service.name} in ${site.city} | ${site.businessName}`,
    description: service.shortDescription,
    alternates: { canonical: `/${service.slug}` },
  };
}

export async function SimpleServiceHubPage(service) {
  const [site, topAreas, topCars, allBatteries, brands, faqs] = await Promise.all([
    getSite(),
    getTopAreas(8),
    getTopCars(8),
    getAllBatteries(),
    getBrands(),
    getFaqs("home"),
  ]);

  const topBatteries = [...allBatteries]
    .filter((b) => b.stock > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  const basePath = `/${service.slug}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: service.name, path: basePath },
  ]);
  const serviceJsonLd = buildServiceJsonLd({
    name: service.name,
    areaServed: site.city,
    provider: site.businessName,
    url: basePath,
  });
  const faqJsonLd = buildFaqJsonLd(faqs);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <nav aria-label="Breadcrumb" className="text-sm text-dark/50">
        <Link href="/" className="hover:text-primary">Home</Link>{" "}
        &gt; <span className="text-dark">{service.name}</span>
      </nav>

      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <ServiceIcon name={service.icon} className="h-7 w-7 text-primary" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-dark">{service.name} in {site.city}</h1>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-dark/70">{service.shortDescription}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:max-w-2xl">
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Mobile, at your location</p>
            <p className="text-sm font-semibold text-dark">Across {site.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <ServiceIcon name={service.icon} className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-dark/50">Every car make &amp; model</p>
            <p className="text-sm font-semibold text-dark">{topCars.length > 0 ? "Supported" : "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-white p-4">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-dark/50">Backed by</p>
            <p className="text-sm font-semibold text-dark">{site.businessName}</p>
          </div>
        </div>
      </div>

      <section className="mx-auto mt-12 max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-dark">Browse by Area</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {topAreas.map((area) => (
                <Link
                  key={area.slug}
                  href={`${basePath}/${area.slug}`}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {area.name}
                </Link>
              ))}
            </div>
            <Link
              href={`${basePath}/areas`}
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              View all {topAreas.length < 300 ? "300" : topAreas.length} areas &gt;
            </Link>
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark">Browse by Car</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {topCars.map((car) => (
                <Link
                  key={car.slug}
                  href={`${basePath}/car/${car.slug}`}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {car.name}
                </Link>
              ))}
            </div>
            <Link
              href={`${basePath}/car`}
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              View all cars &gt;
            </Link>
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark">Browse by Battery</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {topBatteries.map((battery) => (
                <Link
                  key={battery.slug}
                  href={`${basePath}/battery/${battery.slug}`}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {battery.name}
                </Link>
              ))}
            </div>
            <Link
              href={`${basePath}/battery`}
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              View all {allBatteries.length} batteries &gt;
            </Link>
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark">Browse by Brand</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brand/${brand.slug}`}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
            <Link
              href={`${basePath}/brand`}
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              View all {brands.length} brands &gt;
            </Link>
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="mx-auto mt-12 max-w-3xl">
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

      <section className="mx-auto mt-12 max-w-md pb-8">
        <h2 className="text-xl font-bold text-dark">Get a Free Quote</h2>
        <p className="mt-1 text-sm text-dark/60">
          Leave your details and we'll call you back within minutes.
        </p>
        <div className="mt-5">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
