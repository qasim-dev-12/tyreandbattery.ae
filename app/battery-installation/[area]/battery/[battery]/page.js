import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import {
  generateStaticParamsForAreaBatteryCombos,
  areaBatteryComboMetadata,
  AreaBatteryComboPage,
} from "@/lib/pageBuilders/areaBatteryCombo";

const SERVICE_SLUG = "battery-installation";

// Full pre-render (all 12,000) — see docs/SERVICE-PERMUTATION.md "Rendering
// strategy for the 4 new services" for the superseded capped version.
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
