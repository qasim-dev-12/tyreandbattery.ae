import { getAllBatteries } from "./batteries";
import { getBrands } from "./brands";
import { getAllAreas } from "./areas";
import { getAllCars } from "./cars";
import { getServices } from "./services";
import { getCompatMap } from "./compat";
import { isIndexableSync, isBatteryIndexableSync, isBrandIndexableSync, getComboNotes } from "./combos";
import { SITE_URL } from "./constants";

export const MAX_URLS_PER_SITEMAP = 50000;

// Computed fresh on every call (not cached at build time) because
// isIndexable depends on live data — compat.json, combo-notes.json, and
// popularity/demand values can all change independently of a rebuild.
//
// compatMap/comboNotes are fetched once up front and passed into
// isIndexableSync for every combo — at 30,000 combos, re-reading those
// files per iteration (what the plain isIndexable() convenience wrapper
// does) is slow enough to time out the build. See docs/PERMUTATION.md.
//
// Looped over every active service (docs/SERVICE-PERMUTATION.md) — each
// service gets its own full Tier 1/2/3 URL set under /<service.slug>/...
export async function getAllSitemapEntries() {
  const [services, batteries, brands, areas, cars, compatMap, comboNotes] = await Promise.all([
    getServices(),
    getAllBatteries(),
    getBrands(),
    getAllAreas(),
    getAllCars(),
    getCompatMap(),
    getComboNotes(),
  ]);

  const entries = [
    // "/" itself isn't listed — it redirects to the hub below, which is the
    // canonical URL for that content.
    { url: `${SITE_URL}/batteries`, changeFrequency: "daily", priority: 0.9 },
  ];

  for (const battery of batteries) {
    entries.push({
      url: `${SITE_URL}/batteries/${battery.slug}`,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }
  for (const brand of brands) {
    entries.push({ url: `${SITE_URL}/brand/${brand.slug}`, changeFrequency: "weekly", priority: 0.5 });
  }

  for (const service of services) {
    const base = `${SITE_URL}/${service.slug}`;
    entries.push({ url: base, changeFrequency: "weekly", priority: 1 });
    entries.push({ url: `${base}/battery`, changeFrequency: "weekly", priority: 0.7 });
    entries.push({ url: `${base}/brand`, changeFrequency: "weekly", priority: 0.7 });

    for (const area of areas) {
      entries.push({ url: `${base}/${area.slug}`, changeFrequency: "weekly", priority: 0.8 });
    }
    for (const car of cars) {
      entries.push({ url: `${base}/car/${car.slug}`, changeFrequency: "weekly", priority: 0.8 });
    }
    for (const battery of batteries) {
      entries.push({ url: `${base}/battery/${battery.slug}`, changeFrequency: "weekly", priority: 0.8 });
    }

    // Tier 3 (car): only combos that pass the quality gate — see docs/SEO-RULES.md.
    for (const area of areas) {
      for (const car of cars) {
        if (isIndexableSync(service.slug, car, area, compatMap, comboNotes)) {
          entries.push({ url: `${base}/${area.slug}/${car.slug}`, changeFrequency: "weekly", priority: 0.6 });
        }
      }
      for (const battery of batteries) {
        if (isBatteryIndexableSync(service.slug, battery, area, comboNotes)) {
          entries.push({
            url: `${base}/${area.slug}/battery/${battery.slug}`,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
      for (const brand of brands) {
        if (isBrandIndexableSync(service.slug, brand, area, batteries, comboNotes)) {
          entries.push({
            url: `${base}/${area.slug}/brand/${brand.slug}`,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
    }
  }

  return entries;
}

export function shardCountFor(entryCount) {
  return Math.max(1, Math.ceil(entryCount / MAX_URLS_PER_SITEMAP));
}
