import { redirect } from "next/navigation";

// The business currently offers one service — the full landing page lives
// at the service hub rather than duplicating it at the bare root.
export default function Home() {
  redirect("/car-battery-replacement");
}
