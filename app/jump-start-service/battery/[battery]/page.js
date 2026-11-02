import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import { generateStaticParamsForBatteries, batteryPageMetadata, BatteryPage } from "@/lib/pageBuilders/batteryPage";

const SERVICE_SLUG = "jump-start-service";

export const generateStaticParams = generateStaticParamsForBatteries;

export async function generateMetadata({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return batteryPageMetadata(service, await params);
}

export default async function Page({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  const result = await BatteryPage(service, await params);
  if (!result) notFound();
  return result;
}
