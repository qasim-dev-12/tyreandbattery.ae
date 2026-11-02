import "server-only";
import { readJson } from "./db";
import { getAllBatteries } from "./batteries";

export async function getBrands() {
  const [brands, batteries] = await Promise.all([
    readJson("brands.json", []),
    getAllBatteries(),
  ]);
  return brands.map((brand) => ({
    ...brand,
    productCount: batteries.filter((b) => b.brand === brand.name).length,
  }));
}

export async function getBrandBySlug(slug) {
  const brands = await getBrands();
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function getBrandByName(name) {
  const brands = await getBrands();
  return brands.find((b) => b.name === name) ?? null;
}
