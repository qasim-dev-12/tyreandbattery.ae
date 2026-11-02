import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/services";
import { generateStaticParamsForCars, carPageMetadata, CarPage } from "@/lib/pageBuilders/carPage";

const SERVICE_SLUG = "jump-start-service";

export const generateStaticParams = generateStaticParamsForCars;

export async function generateMetadata({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return carPageMetadata(service, await params);
}

export default async function Page({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  const result = await CarPage(service, await params);
  if (!result) notFound();
  return result;
}
