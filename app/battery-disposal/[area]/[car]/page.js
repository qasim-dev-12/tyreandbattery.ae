import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import {
  generateStaticParamsForAreaCarCombos,
  areaCarComboMetadata,
  AreaCarComboPage,
} from "@/lib/pageBuilders/areaCarCombo";

const SERVICE_SLUG = "battery-disposal";

// Capped pre-render (top 1,000 of 30,000) for new services — same strategy
// as car-battery-replacement's own cap (docs/SERVICE-PERMUTATION.md).
export async function generateStaticParams() {
  return generateStaticParamsForAreaCarCombos({ cap: 1000 });
}

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return areaCarComboMetadata(service, await params);
}

export default async function Page({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  const result = await AreaCarComboPage(service, await params);
  if (!result) notFound();
  return result;
}
