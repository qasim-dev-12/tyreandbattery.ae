import { BatteryCharging, Activity, Zap, Wrench, Recycle } from "lucide-react";

// Maps data/services.json's `icon` field (a plain string, since JSON can't
// store a component reference) to the actual lucide-react icon. Add new
// entries here whenever a new service introduces a new icon name.
const ICONS = {
  BatteryCharging,
  Activity,
  Zap,
  Wrench,
  Recycle,
};

export default function ServiceIcon({ name, className }) {
  const Icon = ICONS[name] ?? BatteryCharging;
  return <Icon className={className} aria-hidden="true" />;
}
