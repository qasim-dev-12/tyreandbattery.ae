import "server-only";
import { readJson } from "./db";
import { getBatteriesByIds } from "./batteries";

export async function getCompatMap() {
  return readJson("compat.json", {});
}

export async function getCompatibleBatteryIds(carSlug) {
  const compat = await getCompatMap();
  return compat[carSlug] ?? [];
}

export async function getCompatibleBatteries(carSlug) {
  const ids = await getCompatibleBatteryIds(carSlug);
  return getBatteriesByIds(ids);
}

// Reverse lookup: which car slugs list this battery id as compatible. Used
// by the battery Tier 2 page to show real fitment facts (which cars this
// SKU actually fits), same way car pages show compatible batteries.
export async function getCarSlugsForBattery(batteryId) {
  const compat = await getCompatMap();
  return Object.entries(compat)
    .filter(([, ids]) => ids.includes(batteryId))
    .map(([carSlug]) => carSlug);
}
