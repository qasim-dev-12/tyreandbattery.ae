import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getBrands, getBrandBySlug } from "@/lib/brands";
import { getBatteriesByBrand } from "@/lib/batteries";
import { getSite } from "@/lib/site";
import BatteryCard from "@/components/battery/BatteryCard";

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({ params }) {
  const { brand: brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return {};

  const site = await getSite();
  return {
    title: `${brand.name} Car Batteries | ${site.businessName}`,
    description: brand.description,
    alternates: { canonical: `/brand/${brand.slug}` },
  };
}

export default async function BrandPage({ params }) {
  const { brand: brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();

  const [batteries, site] = await Promise.all([
    getBatteriesByBrand(brand.name),
    getSite(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-dark/50">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>{" "}
        &gt;{" "}
        <Link href="/batteries" className="hover:text-primary">
          Batteries
        </Link>{" "}
        &gt; <span className="text-dark">{brand.name}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 rounded-xl border border-dark/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">{brand.name} Batteries</h1>
          <p className="mt-1 max-w-2xl text-sm text-dark/60">{brand.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-dark/5 px-4 py-2 text-sm font-medium text-dark/70">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          {brand.warrantyMonths} Months Warranty
        </div>
      </div>

      <p className="mt-6 text-sm text-dark/60">{batteries.length} products found</p>

      {batteries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dark/10 bg-white py-16 text-center text-dark/60">
          No batteries currently listed for this brand.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {batteries.map((battery) => (
            <BatteryCard key={battery.id} battery={battery} />
          ))}
        </div>
      )}
    </div>
  );
}
