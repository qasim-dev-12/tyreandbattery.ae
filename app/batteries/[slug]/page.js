import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Clock, Wrench, ShieldCheck } from "lucide-react";
import { getAllBatteries, getBatteryBySlug } from "@/lib/batteries";
import { getSite } from "@/lib/site";
import { SITE_URL } from "@/lib/constants";
import BatteryGallery from "@/components/battery/BatteryGallery";

export async function generateStaticParams() {
  const batteries = await getAllBatteries();
  return batteries.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const battery = await getBatteryBySlug(slug);
  if (!battery) return {};

  const site = await getSite();
  const title = `${battery.name} | ${site.businessName}`;
  const description = `${battery.name} — ${battery.type} car battery, ${battery.capacityAh}Ah, ${battery.warrantyMonths} months warranty. ${battery.description}`;

  return {
    title,
    description,
    alternates: { canonical: `/batteries/${battery.slug}` },
  };
}

export default async function BatteryDetailPage({ params }) {
  const { slug } = await params;
  const battery = await getBatteryBySlug(slug);

  if (!battery) notFound();

  const roundedRating = Math.round(battery.rating);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: battery.name,
    image: [`${SITE_URL}${battery.images?.[0] ?? "/images/batteries/placeholder.svg"}`],
    description: battery.description,
    sku: String(battery.id),
    brand: { "@type": "Brand", name: battery.brand },
    aggregateRating:
      battery.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: battery.rating,
            reviewCount: battery.reviewCount,
          }
        : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-dark/50">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>{" "}
        &gt;{" "}
        <Link href="/batteries" className="hover:text-primary">
          Batteries
        </Link>{" "}
        &gt; <span className="text-dark">{battery.name}</span>
      </nav>

      <div className="mt-4 grid gap-10 md:grid-cols-2">
        <BatteryGallery images={battery.images} name={battery.name} />

        <div>
          <h1 className="text-2xl font-bold text-dark">{battery.name}</h1>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < roundedRating ? "fill-primary text-primary" : "text-dark/20"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-sm text-dark/60">
              {battery.rating} ({battery.reviewCount} reviews)
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 rounded-lg bg-dark/5 p-3 text-center">
              <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium text-dark/70">30 Min Service</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-dark/5 p-3 text-center">
              <Wrench className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium text-dark/70">Free Installation</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-dark/5 p-3 text-center">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium text-dark/70">
                {battery.warrantyMonths} Months Warranty
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm text-dark/70">{battery.description}</p>
        </div>
      </div>
    </div>
  );
}
