import Link from "next/link";
import { getSite } from "@/lib/site";
import { getFeaturedBatteries, getAllBatteries } from "@/lib/batteries";
import { getTopAreas } from "@/lib/areas";
import { getTopCars } from "@/lib/cars";
import { getServices } from "@/lib/services";
import { getBrands } from "@/lib/brands";
import { getFaqs } from "@/lib/faqs";
import Hero from "@/components/sections/Hero";
import FeaturedBatteries from "@/components/sections/FeaturedBatteries";
import WhyUs from "@/components/sections/WhyUs";
import ServicesSection from "@/components/sections/ServicesSection";
import WarningSigns from "@/components/sections/WarningSigns";
import DiagnosisSection from "@/components/sections/DiagnosisSection";
import JumpStartVsReplace from "@/components/sections/JumpStartVsReplace";
import HowItWorks from "@/components/sections/HowItWorks";
import BatteryTypesTable from "@/components/sections/BatteryTypesTable";
import HeatGuide from "@/components/sections/HeatGuide";
import BrandsSection from "@/components/sections/BrandsSection";
import Testimonials from "@/components/sections/Testimonials";
import FaqSection from "@/components/sections/FaqSection";
import ContactForm from "@/components/sections/ContactForm";

export async function generateMetadata() {
  const site = await getSite();
  return {
    title: `Car Battery Replacement in ${site.city} | ${site.businessName}`,
    description: site.hero?.subtext || site.tagline,
  };
}

export default async function CarBatteryReplacementPage() {
  const [site, featured, topAreas, topCars, allBatteries, services, brands, faqs] = await Promise.all([
    getSite(),
    getFeaturedBatteries(8),
    getTopAreas(8),
    getTopCars(8),
    getAllBatteries(),
    getServices(),
    getBrands(),
    getFaqs("home"),
  ]);

  // Top batteries by rating for the "Browse by Battery" links — same role
  // getTopAreas/getTopCars play above (docs/BATTERY-PERMUTATION.md).
  const topBatteries = [...allBatteries]
    .filter((b) => b.stock > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  return (
    <>
      <Hero site={site} />
      <WhyUs site={site} />
      <ServicesSection services={services} />
      <WarningSigns />
      <DiagnosisSection />
      <JumpStartVsReplace />
      <HowItWorks />
      <FeaturedBatteries batteries={featured} />
      <BatteryTypesTable />
      <HeatGuide site={site} />
      <BrandsSection brands={brands} />

      {/* Internal links into the Tier 1/2 programmatic pages. */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-dark">Browse by Area</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {topAreas.map((area) => (
                <Link
                  key={area.slug}
                  href={`/car-battery-replacement/${area.slug}`}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {area.name}
                </Link>
              ))}
            </div>
            <Link
              href="/car-battery-replacement/areas"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              View all 300 areas &gt;
            </Link>
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark">Browse by Car</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {topCars.map((car) => (
                <Link
                  key={car.slug}
                  href={`/car-battery-replacement/car/${car.slug}`}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {car.name}
                </Link>
              ))}
            </div>
            <Link
              href="/car-battery-replacement/car"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              View all 100 cars &gt;
            </Link>
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark">Browse by Battery</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {topBatteries.map((battery) => (
                <Link
                  key={battery.slug}
                  href={`/car-battery-replacement/battery/${battery.slug}`}
                  className="rounded-full border border-dark/15 px-4 py-2 text-sm font-medium text-dark/70 hover:border-primary hover:text-primary"
                >
                  {battery.name}
                </Link>
              ))}
            </div>
            <Link
              href="/car-battery-replacement/battery"
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
              href="/car-battery-replacement/brand"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              View all {brands.length} brands &gt;
            </Link>
          </div>
        </div>
      </section>

      <Testimonials />
      <FaqSection faqs={faqs} />

      <section className="mx-auto max-w-md px-4 py-12">
        <h2 className="text-xl font-bold text-dark">Get a Free Quote</h2>
        <p className="mt-1 text-sm text-dark/60">
          Leave your details and we'll call you back within minutes.
        </p>
        <div className="mt-5">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
