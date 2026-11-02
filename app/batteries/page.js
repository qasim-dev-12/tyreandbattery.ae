import { Suspense } from "react";
import { getAllBatteries, getFilterOptions } from "@/lib/batteries";
import { getSite } from "@/lib/site";
import BatteryGrid from "@/components/battery/BatteryGrid";

export async function generateMetadata() {
  const site = await getSite();
  return {
    title: `All Batteries | ${site.businessName}`,
    description: `Browse car batteries by brand, type and capacity. Fast mobile installation in ${site.city}.`,
  };
}

export default async function BatteriesPage() {
  const [batteries, filterOptions] = await Promise.all([
    getAllBatteries(),
    getFilterOptions(),
  ]);

  return (
    // BatteryGrid reads useSearchParams(), which requires a Suspense boundary
    // so the rest of the route can still be statically rendered.
    <Suspense fallback={null}>
      <BatteryGrid batteries={batteries} filterOptions={filterOptions} />
    </Suspense>
  );
}
