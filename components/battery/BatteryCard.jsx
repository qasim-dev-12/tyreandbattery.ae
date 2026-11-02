"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { slugify } from "@/lib/slugify";

const PLACEHOLDER_IMAGE = "/images/batteries/placeholder.svg";

export default function BatteryCard({ battery }) {
  const { isWishlisted, toggle } = useWishlist();

  // Delivery estimate depends on the current time, which only exists on the
  // client — render nothing for this line until after mount so the server
  // and first client render match (avoids a hydration mismatch).
  const [mounted, setMounted] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const eta = new Date(Date.now() + 60 * 60 * 1000);
    setDeliveryTime(eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }, []);

  const image = battery.images?.[0] || PLACEHOLDER_IMAGE;
  const brandLogo = `/images/brands/${slugify(battery.brand)}.svg`;
  const wishlisted = isWishlisted(battery.id);

  function handleToggleWishlist(e) {
    e.preventDefault();
    toggle(battery.id);
  }

  return (
    <div className="group relative flex flex-col rounded-xl border border-dark/10 bg-white">
      {/* Full-card click target, under the image/text (pointer-events-none)
          and under the heart/Add to Cart buttons (pointer-events-auto, higher
          z-index), so those buttons intercept their own clicks without
          needing stopPropagation. */}
      <Link
        href={`/batteries/${battery.slug}`}
        aria-label={battery.name}
        className="absolute inset-0 z-0 rounded-xl"
      />

      <div className="relative z-10 aspect-square overflow-hidden rounded-t-xl bg-dark/5">
        <Image
          src={image}
          alt={battery.name}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 25vw, 50vw"
          className="object-cover pointer-events-none"
        />

        {/* Faint brand watermark */}
        <Image
          src={brandLogo}
          alt=""
          aria-hidden="true"
          width={64}
          height={26}
          className="pointer-events-none absolute bottom-2 left-2 h-5 w-auto opacity-30"
        />

        {battery.images && battery.images.length > 1 && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {battery.images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-dark shadow hover:bg-white"
        >
          <Heart
            className={`h-4 w-4 ${wishlisted ? "fill-primary text-primary" : "text-dark/60"}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="relative z-10 flex min-h-[180px] flex-col gap-1.5 p-3 pointer-events-none">
        <h3 className="text-sm font-bold uppercase leading-snug text-dark group-hover:text-primary">
          {battery.name}
        </h3>

        {battery.badge && (
          <span className="text-xs font-semibold text-primary">{battery.badge}</span>
        )}

        <p className="mt-auto text-[11px] text-dark/50">
          {mounted ? `Order now & get it by ${deliveryTime}` : " "}
        </p>
      </div>
    </div>
  );
}
