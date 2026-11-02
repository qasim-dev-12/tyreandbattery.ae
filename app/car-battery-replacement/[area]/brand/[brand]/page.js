import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import {
  generateStaticParamsForAreaBrandCombos,
  areaBrandComboMetadata,
  AreaBrandComboPage,
} from "@/lib/pageBuilders/areaBrandCombo";

const SERVICE_SLUG = "car-battery-replacement";

// Full pre-render — unchanged from before the multi-service refactor
// (docs/BATTERY-PERMUTATION.md "Rendering strategy").
export async function generateStaticParams() {
  return generateStaticParamsForAreaBrandCombos();
}

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return areaBrandComboMetadata(service, await params);
}

export default async function Page({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  const result = await AreaBrandComboPage(service, await params);
  if (!result) notFound();
  return result;
}
