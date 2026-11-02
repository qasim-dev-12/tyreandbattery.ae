import { notFound } from "next/navigation";
import { getAllAreas } from "@/lib/areas";
import { getAllCars } from "@/lib/cars";
import { getAllBatteries } from "@/lib/batteries";
import { getBrands } from "@/lib/brands";
import { getServices } from "@/lib/services";
import { getCompatMap } from "@/lib/compat";
import { getComboNotes, BATTERY_RATING_THRESHOLD } from "@/lib/combos";

export const metadata = { robots: { index: false, follow: false } };

// Mirrors lib/combos.js's isIndexable but tracks *why* a combo failed, for
// diagnostics. isIndexable itself stays a plain boolean — this report is
// the one place that needs the reason, so the duplication is intentional
// rather than complicating the shared gate's public API.
function diagnose(serviceSlug, car, area, compatMap, comboNotes) {
  const compatIds = compatMap[car.slug] ?? [];
  if (compatIds.length === 0) {
    return { indexable: false, reason: "No compatible battery in compat.json" };
  }
  if (area.landmarks.length < 2) {
    return { indexable: false, reason: "Area has fewer than 2 landmarks" };
  }
  if (!area.parkingNote) {
    return { indexable: false, reason: "Area missing a parking note" };
  }
  if (comboNotes[`${serviceSlug}__${area.slug}__${car.slug}`]) {
    return { indexable: true, reason: "Has a hand-written combo note" };
  }
  if (car.popularity >= 7 && area.demand >= 6) {
    return { indexable: true, reason: "Meets popularity/demand threshold" };
  }
  return { indexable: false, reason: "Below popularity/demand threshold and no note" };
}

// Battery-tier equivalent of diagnose() above — see
// docs/BATTERY-PERMUTATION.md "Quality gate — area x battery".
function diagnoseBattery(serviceSlug, battery, area, comboNotes) {
  if (!(battery.stock > 0)) {
    return { indexable: false, reason: "Battery out of stock" };
  }
  if (area.landmarks.length < 2) {
    return { indexable: false, reason: "Area has fewer than 2 landmarks" };
  }
  if (!area.parkingNote) {
    return { indexable: false, reason: "Area missing a parking note" };
  }
  if (comboNotes[`${serviceSlug}__${area.slug}__battery__${battery.slug}`]) {
    return { indexable: true, reason: "Has a hand-written combo note" };
  }
  if (battery.rating >= BATTERY_RATING_THRESHOLD && area.demand >= 6) {
    return { indexable: true, reason: "Meets rating/demand threshold" };
  }
  return { indexable: false, reason: "Below rating/demand threshold and no note" };
}

// Brand-tier equivalent — see docs/BATTERY-PERMUTATION.md "Quality gate —
// area x brand". No per-brand popularity field exists today, so the gate
// leans on area demand alone once stock is confirmed.
function diagnoseBrand(serviceSlug, brand, area, batteries, comboNotes) {
  if (!batteries.some((b) => b.brand === brand.name && b.stock > 0)) {
    return { indexable: false, reason: "No in-stock battery for this brand" };
  }
  if (area.landmarks.length < 2) {
    return { indexable: false, reason: "Area has fewer than 2 landmarks" };
  }
  if (!area.parkingNote) {
    return { indexable: false, reason: "Area missing a parking note" };
  }
  if (comboNotes[`${serviceSlug}__${area.slug}__brand__${brand.slug}`]) {
    return { indexable: true, reason: "Has a hand-written combo note" };
  }
  if (area.demand >= 6) {
    return { indexable: true, reason: "Meets area demand threshold" };
  }
  return { indexable: false, reason: "Below area demand threshold and no note" };
}

function CoverageSection({ title, totalLabel, perService, columnLabel }) {
  const totalPossible = perService.reduce((sum, s) => sum + s.total, 0);
  const totalIndexable = perService.reduce((sum, s) => sum + s.indexable, 0);
  const totalNoindex = totalPossible - totalIndexable;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-dark">{title}</h2>
      <p className="mt-1 text-xs text-dark/50">See docs/SERVICE-PERMUTATION.md / docs/BATTERY-PERMUTATION.md.</p>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-dark/10 bg-white p-4">
          <p className="text-2xl font-extrabold text-dark">{totalPossible}</p>
          <p className="text-xs text-dark/50">Total possible across all services ({totalLabel})</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-2xl font-extrabold text-green-700">{totalIndexable}</p>
          <p className="text-xs text-dark/50">Indexable</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-2xl font-extrabold text-amber-700">{totalNoindex}</p>
          <p className="text-xs text-dark/50">Noindex</p>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-dark/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark/10 text-left text-xs text-dark/50">
              <th className="p-3">Service</th>
              <th className="p-3">{columnLabel}</th>
              <th className="p-3">Indexable</th>
              <th className="p-3">Noindex</th>
            </tr>
          </thead>
          <tbody>
            {perService.map((s) => (
              <tr key={s.slug} className="border-b border-dark/5 last:border-0">
                <td className="p-3 font-semibold text-dark">{s.name}</td>
                <td className="p-3 text-dark/70">{s.total}</td>
                <td className="p-3 text-green-700">{s.indexable}</td>
                <td className="p-3 text-amber-700">{s.total - s.indexable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function SeoReportPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [services, areas, cars, batteries, brands, compatMap, comboNotes] = await Promise.all([
    getServices(),
    getAllAreas(),
    getAllCars(),
    getAllBatteries(),
    getBrands(),
    getCompatMap(),
    getComboNotes(),
  ]);

  const carCoverage = [];
  const batteryCoverage = [];
  const brandCoverage = [];

  for (const service of services) {
    let carIndexable = 0;
    for (const area of areas) {
      for (const car of cars) {
        if (diagnose(service.slug, car, area, compatMap, comboNotes).indexable) carIndexable++;
      }
    }
    carCoverage.push({ slug: service.slug, name: service.name, total: areas.length * cars.length, indexable: carIndexable });

    let batteryIndexable = 0;
    for (const area of areas) {
      for (const battery of batteries) {
        if (diagnoseBattery(service.slug, battery, area, comboNotes).indexable) batteryIndexable++;
      }
    }
    batteryCoverage.push({
      slug: service.slug,
      name: service.name,
      total: areas.length * batteries.length,
      indexable: batteryIndexable,
    });

    let brandIndexable = 0;
    for (const area of areas) {
      for (const brand of brands) {
        if (diagnoseBrand(service.slug, brand, area, batteries, comboNotes).indexable) brandIndexable++;
      }
    }
    brandCoverage.push({ slug: service.slug, name: service.name, total: areas.length * brands.length, indexable: brandIndexable });
  }

  const unverifiedCars = cars.filter((c) => !c.dataVerified);
  const carsWithoutCompat = cars.filter((c) => (compatMap[c.slug]?.length ?? 0) === 0);
  const areasWithFewLandmarks = areas.filter((a) => a.landmarks.length < 2);
  const areasWithoutParkingNote = areas.filter((a) => !a.parkingNote);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-dark">SEO Report (dev only)</h1>
      <p className="mt-1 text-sm text-dark/60">
        Not reachable in production — {services.length} active services, each with its own Tier 1/2/3 page set.
      </p>

      <CoverageSection
        title="Car combo coverage (service × area × car)"
        totalLabel={`${areas.length} areas × ${cars.length} cars × ${services.length} services`}
        columnLabel="Total combos"
        perService={carCoverage}
      />
      <CoverageSection
        title="Battery combo coverage (service × area × battery)"
        totalLabel={`${areas.length} areas × ${batteries.length} batteries × ${services.length} services`}
        columnLabel="Total combos"
        perService={batteryCoverage}
      />
      <CoverageSection
        title="Brand combo coverage (service × area × brand)"
        totalLabel={`${areas.length} areas × ${brands.length} brands × ${services.length} services`}
        columnLabel="Total combos"
        perService={brandCoverage}
      />

      <section className="mt-8">
        <h2 className="text-lg font-bold text-dark">Data gaps</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-dark/70">
          <li>
            <strong className="text-dark">{unverifiedCars.length}</strong> of {cars.length} cars have{" "}
            <code>dataVerified: false</code>
            {unverifiedCars.length > 0 && (
              <span className="text-dark/50"> — {unverifiedCars.map((c) => c.slug).join(", ")}</span>
            )}
          </li>
          <li>
            <strong className="text-dark">{carsWithoutCompat.length}</strong> cars have no compatible battery in{" "}
            <code>compat.json</code>
            {carsWithoutCompat.length > 0 && (
              <span className="text-dark/50"> — {carsWithoutCompat.map((c) => c.slug).join(", ")}</span>
            )}
          </li>
          <li>
            <strong className="text-dark">{areasWithFewLandmarks.length}</strong> areas have fewer than 2 landmarks
            {areasWithFewLandmarks.length > 0 && (
              <span className="text-dark/50"> — {areasWithFewLandmarks.map((a) => a.slug).join(", ")}</span>
            )}
          </li>
          <li>
            <strong className="text-dark">{areasWithoutParkingNote.length}</strong> areas are missing a parking note
            {areasWithoutParkingNote.length > 0 && (
              <span className="text-dark/50"> — {areasWithoutParkingNote.map((a) => a.slug).join(", ")}</span>
            )}
          </li>
        </ul>
      </section>
    </div>
  );
}
