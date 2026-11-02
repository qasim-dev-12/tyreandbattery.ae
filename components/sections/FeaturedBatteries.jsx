"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import BatteryCard from "@/components/battery/BatteryCard";

export default function FeaturedBatteries({ batteries }) {
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  // Optimistically assume there's more to scroll to until the first measurement
  // proves otherwise — avoids a flash where the arrow is briefly missing.
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [batteries]);

  function scrollByCards(direction) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark">Featured Batteries</h2>
          <p className="mt-1 text-sm text-dark/60">
            Our most popular picks, from budget-friendly to premium.
          </p>
        </div>
        <Link
          href="/batteries"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
        >
          Shop Batteries <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative mt-6">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-dark shadow-md hover:bg-dark/5"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        <div
          ref={scrollerRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth"
        >
          {batteries.map((battery) => (
            <div key={battery.id} className="w-56 shrink-0 sm:w-64">
              <BatteryCard battery={battery} />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white text-dark shadow-md hover:bg-dark/5"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/batteries"
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Shop All Batteries <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
