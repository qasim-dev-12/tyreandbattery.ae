import Link from "next/link";
import Image from "next/image";
import { BatteryCharging, Zap, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";

const PLACEHOLDER_IMAGE = "/images/batteries/placeholder.svg";

// Facts-only battery summary for SEO combo pages — no price, no add-to-cart,
// no wishlist. Those pages exist to target search terms (area/battery/brand
// permutations), not to sell directly; the existing BatteryCard (with
// pricing/cart) stays on /batteries and the car combo pages where that's
// the point. Plain server component — no client JS needed here.
export default function BatterySpecCard({ battery }) {
  const inStock = battery.stock > 0;
  const image = battery.images?.[0] || PLACEHOLDER_IMAGE;

  return (
    <Link
      href={`/batteries/${battery.slug}`}
      className="flex flex-col gap-3 rounded-xl border border-dark/10 bg-white p-4 hover:border-primary"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-dark/5">
        <Image src={image} alt={battery.name} fill sizes="200px" className="object-cover" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold uppercase leading-snug text-dark">{battery.name}</h3>
        {inStock ? (
          <span className="flex shrink-0 items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> In stock
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1 rounded bg-dark/5 px-1.5 py-0.5 text-[10px] font-semibold text-dark/50">
            <XCircle className="h-3 w-3" aria-hidden="true" /> Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-dark/60">
        <span className="flex items-center gap-1">
          <BatteryCharging className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {battery.type}, {battery.capacityAh}Ah
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {battery.cca} CCA
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {battery.warrantyMonths}mo warranty
        </span>
      </div>
    </Link>
  );
}
