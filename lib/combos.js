import "server-only";
import { readJson } from "./db";
import { getCompatMap } from "./compat";
import { getAllBatteries } from "./batteries";

export async function getComboNotes() {
  return readJson("combo-notes.json", {});
}

// Every combo-notes key is prefixed by service slug (docs/SERVICE-PERMUTATION.md)
// — the same area+car pair can carry a different hand-written note (or none)
// per service, since "replacing a battery in Downtown 1" and "jump-starting
// one there" are different facts.
export async function getComboNote(serviceSlug, areaSlug, carSlug) {
  const notes = await getComboNotes();
  return notes[`${serviceSlug}__${areaSlug}__${carSlug}`] ?? null;
}

export async function getBatteryComboNote(serviceSlug, areaSlug, batterySlug) {
  const notes = await getComboNotes();
  return notes[`${serviceSlug}__${areaSlug}__battery__${batterySlug}`] ?? null;
}

export async function getBrandComboNote(serviceSlug, areaSlug, brandSlug) {
  const notes = await getComboNotes();
  return notes[`${serviceSlug}__${areaSlug}__brand__${brandSlug}`] ?? null;
}

// The Tier 3 (service x area x car) indexability gate, given already-fetched
// compat and combo-note maps. Use this (not isIndexable) in any loop over
// many combos — isIndexable's own compat.json/combo-notes.json reads are
// cheap once, but re-reading them per iteration is what times out the build
// at 30,000 combos (see docs/PERMUTATION.md).
export function isIndexableSync(serviceSlug, car, area, compatMap, comboNotes) {
  const compatIds = compatMap[car.slug] ?? [];
  if (compatIds.length === 0) return false;
  if (area.landmarks.length < 2) return false;
  if (!area.parkingNote) return false;

  if (comboNotes[`${serviceSlug}__${area.slug}__${car.slug}`]) return true;

  return car.popularity >= 7 && area.demand >= 6;
}

// Convenience wrapper for the common case: checking a single combo (e.g. on
// a Tier 3 page render). Fetches both maps once, then delegates. See
// docs/SEO-RULES.md for the full rationale — a combo page is only indexed
// if it carries genuinely unique, useful content; everything else still
// renders but is noindex.
export async function isIndexable(serviceSlug, car, area) {
  const [compatMap, comboNotes] = await Promise.all([getCompatMap(), getComboNotes()]);
  return isIndexableSync(serviceSlug, car, area, compatMap, comboNotes);
}

// Ranks every possible area x car combo by area.demand * car.popularity,
// descending. Used by generateStaticParams to pre-render only the top N
// (see docs/SEO-RULES.md "Rendering strategy"). Not service-specific — the
// ranking only depends on area/car facts, so it's reused across services.
export function rankCombos(cars, areas) {
  const combos = [];
  for (const area of areas) {
    for (const car of cars) {
      combos.push({ area, car, score: area.demand * car.popularity });
    }
  }
  return combos.sort((a, b) => b.score - a.score);
}

// "Worth a dedicated area combo page" signal for a single battery SKU — the
// battery-tier equivalent of car.popularity >= 7. See
// docs/BATTERY-PERMUTATION.md "Quality gate — area x battery".
export const BATTERY_RATING_THRESHOLD = 4.3;

// The area x battery indexability gate, given an already-fetched
// combo-notes map (same rationale as isIndexableSync — never re-read
// combo-notes.json per iteration over thousands of combos).
export function isBatteryIndexableSync(serviceSlug, battery, area, comboNotes) {
  if (!(battery.stock > 0)) return false;
  if (area.landmarks.length < 2) return false;
  if (!area.parkingNote) return false;

  if (comboNotes[`${serviceSlug}__${area.slug}__battery__${battery.slug}`]) return true;

  return battery.rating >= BATTERY_RATING_THRESHOLD && area.demand >= 6;
}

export async function isBatteryIndexable(serviceSlug, battery, area) {
  const comboNotes = await getComboNotes();
  return isBatteryIndexableSync(serviceSlug, battery, area, comboNotes);
}

// The area x brand indexability gate. `batteries` is the full batteries list
// (passed in rather than re-read per iteration, same rationale as above) —
// a brand is indexable for an area if it has real in-stock inventory, the
// area itself clears the same bar as every other tier, and either a
// hand-written note exists or the area has enough demand to justify a
// dedicated brand page. No per-brand popularity field exists today
// (data/brands.json), so unlike the car/battery gates this one leans on
// area demand alone — see docs/BATTERY-PERMUTATION.md.
export function isBrandIndexableSync(serviceSlug, brand, area, batteries, comboNotes) {
  const hasStock = batteries.some((b) => b.brand === brand.name && b.stock > 0);
  if (!hasStock) return false;
  if (area.landmarks.length < 2) return false;
  if (!area.parkingNote) return false;

  if (comboNotes[`${serviceSlug}__${area.slug}__brand__${brand.slug}`]) return true;

  return area.demand >= 6;
}

export async function isBrandIndexable(serviceSlug, brand, area) {
  const [batteries, comboNotes] = await Promise.all([getAllBatteries(), getComboNotes()]);
  return isBrandIndexableSync(serviceSlug, brand, area, batteries, comboNotes);
}
