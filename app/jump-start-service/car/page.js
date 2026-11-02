import { getServiceBySlug } from "@/lib/services";
import { carDirectoryMetadata, CarDirectoryPage } from "@/lib/pageBuilders/carDirectory";

const SERVICE_SLUG = "jump-start-service";

export async function generateMetadata() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return carDirectoryMetadata(service);
}

export default async function Page() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return CarDirectoryPage(service);
}
