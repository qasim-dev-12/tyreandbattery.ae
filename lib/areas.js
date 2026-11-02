import "server-only";
import { readJson } from "./db";

export async function getAllAreas() {
  return readJson("areas.json", []);
}

export async function getAreaBySlug(slug) {
  const areas = await getAllAreas();
  return areas.find((a) => a.slug === slug) ?? null;
}

export async function getTopAreas(limit = 10) {
  const areas = await getAllAreas();
  return [...areas].sort((a, b) => b.demand - a.demand).slice(0, limit);
}

// Resolves an area's nearbyAreas slugs into full area records, used for
// "nearby areas" internal links on area and combo pages.
export async function getNearbyAreas(area, limit = 4) {
  const areas = await getAllAreas();
  const bySlug = new Map(areas.map((a) => [a.slug, a]));
  return area.nearbyAreas
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, limit);
}
