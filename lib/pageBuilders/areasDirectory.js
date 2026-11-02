import Link from "next/link";
import { getAllAreas } from "@/lib/areas";
import { getAllCars } from "@/lib/cars";
import { getCompatMap } from "@/lib/compat";
import { isIndexableSync, getComboNotes } from "@/lib/combos";
import { getSite } from "@/lib/site";

export async function areasDirectoryMetadata(service) {
  const site = await getSite();
  return {
    title: `All Areas for ${service.name} in ${site.city} | ${site.businessName}`,
    description: `Every area where ${site.businessName} offers ${service.name.toLowerCase()} in ${site.city}.`,
    alternates: { canonical: `/${service.slug}/areas` },
  };
}

function groupByBaseName(areas) {
  const groups = new Map();
  for (const area of areas) {
    const words = area.name.split(" ");
    const base = words.slice(0, -1).join(" ");
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push(area);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function bestComboFor(serviceSlug, area, cars, compatMap, comboNotes) {
  let best = null;
  for (const car of cars) {
    if (!isIndexableSync(serviceSlug, car, area, compatMap, comboNotes)) continue;
    if (!best || car.popularity > best.popularity) best = car;
  }
  return best;
}

export async function AreasDirectoryPage(service) {
  const [areas, cars, compatMap, comboNotes] = await Promise.all([
    getAllAreas(),
    getAllCars(),
    getCompatMap(),
    getComboNotes(),
  ]);
  const groups = groupByBaseName(areas);
  const basePath = `/${service.slug}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-dark/50">
        <Link href="/" className="hover:text-primary">Home</Link>{" "}
        &gt;{" "}
        <Link href={basePath} className="hover:text-primary">{service.name}</Link>{" "}
        &gt; <span className="text-dark">All Areas</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">All Areas We Cover</h1>
      <p className="mt-2 text-sm text-dark/60">{areas.length} areas across Dubai for {service.name.toLowerCase()}.</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(([base, groupAreas]) => (
          <div key={base}>
            <h3 className="text-sm font-bold text-dark">{base}</h3>
            <div className="mt-2 flex flex-col gap-2">
              {groupAreas.map((area) => {
                const combo = bestComboFor(service.slug, area, cars, compatMap, comboNotes);
                return (
                  <div key={area.slug} className="flex flex-wrap items-baseline gap-x-2">
                    <Link
                      href={`${basePath}/${area.slug}`}
                      className="rounded-full border border-dark/15 px-3 py-1.5 text-xs font-medium text-dark/70 hover:border-primary hover:text-primary"
                    >
                      {area.name}
                    </Link>
                    {combo && (
                      <Link
                        href={`${basePath}/${area.slug}/${combo.slug}`}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        {combo.make} {combo.model} here &gt;
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
