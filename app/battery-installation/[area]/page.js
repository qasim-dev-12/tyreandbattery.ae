import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import { generateStaticParamsForAreas, areaPageMetadata, AreaPage } from "@/lib/pageBuilders/areaPage";

const SERVICE_SLUG = "battery-installation";

export const generateStaticParams = generateStaticParamsForAreas;

export async function generateMetadata({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return areaPageMetadata(service, await params);
}

export default async function Page({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  const result = await AreaPage(service, await params);
  if (!result) notFound();
  return result;
}
