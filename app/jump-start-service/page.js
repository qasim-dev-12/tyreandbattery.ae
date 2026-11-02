import { getServiceBySlug } from "@/lib/services";
import { simpleServiceHubMetadata, SimpleServiceHubPage } from "@/lib/pageBuilders/simpleServiceHub";

const SERVICE_SLUG = "jump-start-service";

export async function generateMetadata() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return simpleServiceHubMetadata(service);
}

export default async function Page() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return SimpleServiceHubPage(service);
}
