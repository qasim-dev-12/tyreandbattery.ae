import Link from "next/link";
import { getAllBatteries } from "@/lib/batteries";
import { getAllAreas } from "@/lib/areas";
import { isBatteryIndexableSync, getComboNotes } from "@/lib/combos";
import { getSite } from "@/lib/site";

export async function batteryDirectoryMetadata(service) {
  const site = await getSite();
  return {
    title: `All Batteries — ${service.name} | ${site.businessName}`,
    description: `Every battery SKU ${site.businessName} supports for ${service.name.toLowerCase()}.`,
    alternates: { canonical: `/${service.slug}/battery` },
  };
}

function groupByBrand(batteries) {
  const groups = new Map();
  for (const battery of batteries) {
    if (!groups.has(battery.brand)) groups.set(battery.brand, []);
    groups.get(battery.brand).push(battery);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function bestComboFor(serviceSlug, battery, areas, comboNotes) {
  let best = null;
  for (const area of areas) {
    if (!isBatteryIndexableSync(serviceSlug, battery, area, comboNotes)) continue;
    if (!best || area.demand > best.demand) best = area;
  }
  return best;
}

export async function BatteryDirectoryPage(service) {
  const [batteries, areas, comboNotes] = await Promise.all([
    getAllBatteries(),
    getAllAreas(),
    getComboNotes(),
  ]);
  const groups = groupByBrand(batteries);
  const basePath = `/${service.slug}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-dark/50">
        <Link href="/" className="hover:text-primary">Home</Link>{" "}
        &gt;{" "}
        <Link href={basePath} className="hover:text-primary">{service.name}</Link>{" "}
        &gt; <span className="text-dark">All Batteries</span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-dark">All Batteries — {service.name}</h1>
      <p className="mt-2 text-sm text-dark/60">{batteries.length} battery models supported.</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(([brand, groupBatteries]) => (
          <div key={brand}>
            <h3 className="text-sm font-bold text-dark">{brand}</h3>
            <div className="mt-2 flex flex-col gap-2">
              {groupBatteries.map((battery) => {
                const combo = bestComboFor(service.slug, battery, areas, comboNotes);
                return (
                  <div key={battery.slug} className="flex flex-wrap items-baseline gap-x-2">
                    <Link
                      href={`${basePath}/battery/${battery.slug}`}
                      className="rounded-full border border-dark/15 px-3 py-1.5 text-xs font-medium text-dark/70 hover:border-primary hover:text-primary"
                    >
                      {battery.name}
                    </Link>
                    {combo && (
                      <Link
                        href={`${basePath}/${combo.slug}/battery/${battery.slug}`}
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
