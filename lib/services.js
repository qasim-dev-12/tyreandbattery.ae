import "server-only";
import { readJson } from "./db";

export async function getServices({ activeOnly = true } = {}) {
  const services = await readJson("services.json", []);
  return activeOnly ? services.filter((s) => s.active) : services;
}

export async function getServiceBySlug(slug) {
  const services = await getServices({ activeOnly: false });
  return services.find((s) => s.slug === slug) ?? null;
}
