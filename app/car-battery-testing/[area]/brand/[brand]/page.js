import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import {
  generateStaticParamsForAreaBrandCombos,
  areaBrandComboMetadata,
  AreaBrandComboPage,
} from "@/lib/pageBuilders/areaBrandCombo";

const SERVICE_SLUG = "car-battery-testing";

// Capped pre-render (top 500 of 3,600) for new services
// (docs/SERVICE-PERMUTATION.md "Rendering strategy for the 4 new services").
export async function generateStaticParams() {
  return generateStaticParamsForAreaBrandCombos({ cap: 500 });
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
