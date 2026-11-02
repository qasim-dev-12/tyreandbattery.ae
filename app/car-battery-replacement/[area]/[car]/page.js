import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import {
  generateStaticParamsForAreaCarCombos,
  areaCarComboMetadata,
  AreaCarComboPage,
} from "@/lib/pageBuilders/areaCarCombo";

const SERVICE_SLUG = "car-battery-replacement";

// Pre-render only the highest-value combos; the long tail still renders on
// first request via dynamicParams and is cached for a day afterward
// (docs/SEO-RULES.md, unchanged from before the multi-service refactor).
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
