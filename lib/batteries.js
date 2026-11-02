import "server-only";
import { readJson } from "./db";
export { slugify } from "./slugify";

export async function getAllBatteries() {
  return readJson("batteries.json", []);
}

export async function getBatteryBySlug(slug) {
  const batteries = await getAllBatteries();
  return batteries.find((b) => b.slug === slug) ?? null;
}

export async function getBatteryById(id) {
  const batteries = await getAllBatteries();
  return batteries.find((b) => b.id === id) ?? null;
}

export async function getBatteriesByIds(ids) {
  const batteries = await getAllBatteries();
  const idSet = new Set(ids);
  return batteries.filter((b) => idSet.has(b.id));
}

export async function getBatteriesByBrand(brandName) {
  const batteries = await getAllBatteries();
  return batteries.filter((b) => b.brand === brandName);
}

export async function getFeaturedBatteries(limit = 8) {
  const batteries = await getAllBatteries();
  return [...batteries].sort((a, b) => a.price - b.price).slice(0, limit);
}

export async function getFilterOptions() {
  const batteries = await getAllBatteries();

  const brandCounts = new Map();
  const typeCounts = new Map();
  const capacityCounts = new Map();
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const b of batteries) {
    brandCounts.set(b.brand, (brandCounts.get(b.brand) ?? 0) + 1);
    typeCounts.set(b.type, (typeCounts.get(b.type) ?? 0) + 1);
    capacityCounts.set(b.capacityAh, (capacityCounts.get(b.capacityAh) ?? 0) + 1);
    if (b.price < minPrice) minPrice = b.price;
    if (b.price > maxPrice) maxPrice = b.price;
  }

  const toSortedList = (map, key) =>
    [...map.entries()]
      .map(([value, count]) => ({ [key]: value, count }))
      .sort((a, b) => (a[key] > b[key] ? 1 : -1));

  return {
    brands: toSortedList(brandCounts, "brand"),
    types: toSortedList(typeCounts, "type"),
    capacities: [...capacityCounts.entries()]
      .map(([capacityAh, count]) => ({ capacityAh, count }))
      .sort((a, b) => a.capacityAh - b.capacityAh),
    minPrice: batteries.length ? minPrice : 0,
    maxPrice: batteries.length ? maxPrice : 0,
  };
}
