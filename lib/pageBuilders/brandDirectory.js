import Link from "next/link";
import { getBrands } from "@/lib/brands";
import { getAllBatteries } from "@/lib/batteries";
import { getAllAreas } from "@/lib/areas";
import { isBrandIndexableSync, getComboNotes } from "@/lib/combos";
import { getSite } from "@/lib/site";

export async function brandDirectoryMetadata(service) {
  const site = await getSite();
  return {
    title: `All Battery Brands — ${service.name} | ${site.businessName}`,
    description: `Every battery brand ${site.businessName} supports for ${service.name.toLowerCase()}.`,
    alternates: { canonical: `/${service.slug}/brand` },
  };
}

function bestComboFor(serviceSlug, brand, areas, batteries, comboNotes) {
  let best = null;
  for (const area of areas) {
    if (!isBrandIndexableSync(serviceSlug, brand, area, batteries, comboNotes)) continue;
    if (!best || area.demand > best.demand) best = area;
  }
  return best;
}

export async function BrandDirectoryPage(service) {
  const [brands, batteries, areas, comboNotes] = await Promise.all([
    getBrands(),
    getAllBatteries(),
    getAllAreas(),
    getComboNotes(),
  ]);
  const basePath = `/${service.slug}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-dark/50">
        <Link href="/" className="hover:text-primary">Home</Link>{" "}
        &gt;{" "}
        <Link href={basePath} className="hover:text-primary">{service.name}</Link>{" "}
        &gt; <span className="text-dark">All Brands</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">All Battery Brands — {service.name}</h1>
      <p className="mt-2 text-sm text-dark/60">{brands.length} brands supported.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => {
          const combo = bestComboFor(service.slug, brand, areas, batteries, comboNotes);
          return (
            <div
              key={brand.slug}
              className="flex flex-col gap-2 rounded-xl border border-dark/10 bg-white p-4"
            >
              <Link
                href={`/brand/${brand.slug}`}
                className="font-bold text-dark hover:text-primary"
              >
                {brand.name}
              </Link>
              <p className="text-xs text-dark/60">
                {brand.productCount} model{brand.productCount === 1 ? "" : "s"} &middot; {brand.warrantyMonths}mo warranty
              </p>
              {combo && (
                <Link
                  href={`${basePath}/${combo.slug}/brand/${brand.slug}`}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  serving {combo.name} &gt;
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
