import { getServiceBySlug } from "@/lib/services";
import { areasDirectoryMetadata, AreasDirectoryPage } from "@/lib/pageBuilders/areasDirectory";

const SERVICE_SLUG = "car-battery-replacement";

export async function generateMetadata() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return areasDirectoryMetadata(service);
}

export default async function Page() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return AreasDirectoryPage(service);
}
