import { getServiceBySlug } from "@/lib/services";
import { batteryDirectoryMetadata, BatteryDirectoryPage } from "@/lib/pageBuilders/batteryDirectory";

const SERVICE_SLUG = "battery-installation";

export async function generateMetadata() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return batteryDirectoryMetadata(service);
}

export default async function Page() {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return BatteryDirectoryPage(service);
}
