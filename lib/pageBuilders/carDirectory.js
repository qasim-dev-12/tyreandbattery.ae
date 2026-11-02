import Link from "next/link";
import { getAllCars } from "@/lib/cars";
import { getAllAreas } from "@/lib/areas";
import { getCompatMap } from "@/lib/compat";
import { isIndexableSync, getComboNotes } from "@/lib/combos";
import { getSite } from "@/lib/site";

export async function carDirectoryMetadata(service) {
  const site = await getSite();
  return {
    title: `All Cars — ${service.name} | ${site.businessName}`,
    description: `Every car model ${site.businessName} supports for ${service.name.toLowerCase()}.`,
    alternates: { canonical: `/${service.slug}/car` },
  };
}

function groupByMake(cars) {
  const groups = new Map();
  for (const car of cars) {
    if (!groups.has(car.make)) groups.set(car.make, []);
    groups.get(car.make).push(car);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function bestComboFor(serviceSlug, car, areas, compatMap, comboNotes) {
  let best = null;
  for (const area of areas) {
    if (!isIndexableSync(serviceSlug, car, area, compatMap, comboNotes)) continue;
    if (!best || area.demand > best.demand) best = area;
  }
  return best;
}

export async function CarDirectoryPage(service) {
  const [cars, areas, compatMap, comboNotes] = await Promise.all([
    getAllCars(),
    getAllAreas(),
    getCompatMap(),
    getComboNotes(),
  ]);
  const groups = groupByMake(cars);
  const basePath = `/${service.slug}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-dark/50">
        <Link href="/" className="hover:text-primary">Home</Link>{" "}
        &gt;{" "}
        <Link href={basePath} className="hover:text-primary">{service.name}</Link>{" "}
        &gt; <span className="text-dark">All Cars</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">All Cars — {service.name}</h1>
      <p className="mt-2 text-sm text-dark/60">{cars.length} car models supported.</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(([make, groupCars]) => (
          <div key={make}>
            <h3 className="text-sm font-bold text-dark">{make}</h3>
            <div className="mt-2 flex flex-col gap-2">
              {groupCars.map((car) => {
                const combo = bestComboFor(service.slug, car, areas, compatMap, comboNotes);
                return (
                  <div key={car.slug} className="flex flex-wrap items-baseline gap-x-2">
                    <Link
                      href={`${basePath}/car/${car.slug}`}
                      className="rounded-full border border-dark/15 px-3 py-1.5 text-xs font-medium text-dark/70 hover:border-primary hover:text-primary"
                    >
                      {car.model} ({car.yearFrom}–{car.yearTo})
                    </Link>
                    {combo && (
                      <Link
                        href={`${basePath}/${combo.slug}/${car.slug}`}
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
        ))}
      </div>
    </div>
  );
}
