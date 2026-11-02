import { getServiceBySlug } from "@/lib/services";
import { brandDirectoryMetadata, BrandDirectoryPage } from "@/lib/pageBuilders/brandDirectory";

const SERVICE_SLUG = "battery-disposal";

export async function generateMetadata() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return brandDirectoryMetadata(service);
}

export default async function Page() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return BrandDirectoryPage(service);
}
