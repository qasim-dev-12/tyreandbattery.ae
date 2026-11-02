import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import {
  generateStaticParamsForAreaBatteryCombos,
  areaBatteryComboMetadata,
  AreaBatteryComboPage,
} from "@/lib/pageBuilders/areaBatteryCombo";

const SERVICE_SLUG = "car-battery-replacement";

// Full pre-render — unchanged from before the multi-service refactor
// (docs/BATTERY-PERMUTATION.md "Rendering strategy").
export async function generateStaticParams() {
  return generateStaticParamsForAreaBatteryCombos();
}

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return areaBatteryComboMetadata(service, await params);
}

export default async function Page({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  const result = await AreaBatteryComboPage(service, await params);
  if (!result) notFound();
  return result;
}
