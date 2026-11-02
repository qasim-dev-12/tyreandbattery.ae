import "server-only";
import { readJson } from "./db";

export async function getAllCars() {
  return readJson("cars.json", []);
}

export async function getCarBySlug(slug) {
  const cars = await getAllCars();
  return cars.find((c) => c.slug === slug) ?? null;
}

export async function getTopCars(limit = 10) {
  const cars = await getAllCars();
  return [...cars].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

// Cars sharing the same make or battery type as the given car, used for
// "related cars" internal links on car and combo pages.
export async function getRelatedCars(car, limit = 4) {
  const cars = await getAllCars();
  return cars
    .filter(
      (c) =>
        c.slug !== car.slug &&
        (c.make === car.make || c.batteryType === car.batteryType)
    )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}
