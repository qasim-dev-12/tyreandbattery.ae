"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import BatteryCard from "./BatteryCard";
import FilterPanel from "./FilterPanel";
import MobileFilterDrawer from "./MobileFilterDrawer";
import { slugify } from "@/lib/slugify";

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "name-asc", label: "Name: A to Z" },
];

function parseList(param) {
  return param ? param.split(",").filter(Boolean) : [];
}

// "45ah" and "45 ah" must both match a 45Ah battery: strip spaces from both
// sides before comparing the capacity-specific candidate string.
function matchesQuery(battery, rawQuery) {
  if (!rawQuery.trim()) return true;
  const q = rawQuery.toLowerCase().trim();
  const qNoSpace = q.replace(/\s+/g, "");
  const haystack = `${battery.brand} ${battery.name} ${battery.type}`.toLowerCase();
  const capacityStr = `${battery.capacityAh}ah`;
  return haystack.includes(q) || capacityStr.includes(qNoSpace);
}

export default function BatteryGrid({ batteries, filterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const q = searchParams.get("q") ?? "";
  const selectedBrands = parseList(searchParams.get("brand"));
  const selectedTypes = parseList(searchParams.get("type"));
  const selectedCapacities = parseList(searchParams.get("capacity")).map(Number);
  const sort = searchParams.get("sort") ?? "rating";

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggleInParam(key, current, value) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateParams({ [key]: next.length ? next.join(",") : null });
  }

  const handleSearchChange = (e) => updateParams({ q: e.target.value || null });
  const handleSortChange = (e) =>
    updateParams({ sort: e.target.value === "rating" ? null : e.target.value });
  const toggleBrand = (slug) => toggleInParam("brand", selectedBrands, slug);
  const toggleType = (type) => toggleInParam("type", selectedTypes, type);
  const toggleCapacity = (cap) => toggleInParam("capacity", selectedCapacities, cap);
  const handleClearAll = () => router.replace(pathname, { scroll: false });

  const inBrands = (b) => selectedBrands.length === 0 || selectedBrands.includes(slugify(b.brand));
  const inTypes = (b) => selectedTypes.length === 0 || selectedTypes.includes(b.type);
  const inCapacities = (b) =>
    selectedCapacities.length === 0 || selectedCapacities.includes(b.capacityAh);

  const filtered = useMemo(
    () => batteries.filter((b) => matchesQuery(b, q) && inBrands(b) && inTypes(b) && inCapacities(b)),
    [batteries, q, selectedBrands, selectedTypes, selectedCapacities]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "name-asc") arr.sort((a, b) => a.name.localeCompare(b.name));
    else arr.sort((a, b) => b.rating - a.rating);
    return arr;
  }, [filtered, sort]);

  // Each facet's option counts are computed against every OTHER active
  // filter (but not its own selections), so unchecking a box never hides
  // options that would become available again.
  const brandOptions = useMemo(() => {
    const base = batteries.filter((b) => matchesQuery(b, q) && inTypes(b) && inCapacities(b));
    const counts = new Map();
    for (const b of base) {
      const slug = slugify(b.brand);
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    return filterOptions.brands.map((opt) => {
      const value = slugify(opt.brand);
      return { value, label: opt.brand, count: counts.get(value) ?? 0 };
    });
  }, [batteries, q, selectedTypes, selectedCapacities, filterOptions.brands]);

  const typeOptions = useMemo(() => {
    const base = batteries.filter((b) => matchesQuery(b, q) && inBrands(b) && inCapacities(b));
    const counts = new Map();
    for (const b of base) counts.set(b.type, (counts.get(b.type) ?? 0) + 1);
    return filterOptions.types.map((opt) => ({
      value: opt.type,
      label: opt.type,
      count: counts.get(opt.type) ?? 0,
    }));
  }, [batteries, q, selectedBrands, selectedCapacities, filterOptions.types]);

  const capacityOptions = useMemo(() => {
    const base = batteries.filter((b) => matchesQuery(b, q) && inBrands(b) && inTypes(b));
    const counts = new Map();
    for (const b of base) counts.set(b.capacityAh, (counts.get(b.capacityAh) ?? 0) + 1);
    return filterOptions.capacities.map((opt) => ({
      value: opt.capacityAh,
      label: `${opt.capacityAh}Ah`,
      count: counts.get(opt.capacityAh) ?? 0,
    }));
  }, [batteries, q, selectedBrands, selectedTypes, filterOptions.capacities]);

  const filterPanelProps = {
    brandOptions,
    typeOptions,
    capacityOptions,
    selectedBrands,
    selectedTypes,
    selectedCapacities,
    onToggleBrand: toggleBrand,
    onToggleType: toggleType,
    onToggleCapacity: toggleCapacity,
    onClearAll: handleClearAll,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-dark/50">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>{" "}
        &gt; <span className="text-dark">Batteries</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">All Batteries</h1>
          <p className="mt-1 text-sm text-dark/60">{sorted.length} products found</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-dark/70">
          Sort by
          <select
            value={sort}
            onChange={handleSortChange}
            className="rounded-md border border-dark/20 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark/40"
          aria-hidden="true"
        />
        <input
          type="search"
          value={q}
          onChange={handleSearchChange}
          aria-label="Search batteries"
          placeholder="Search by brand, model, capacity, or type..."
          className="w-full rounded-full border border-dark/20 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="mt-4 flex items-center gap-2 rounded-full border border-dark/20 px-4 py-2 text-sm font-medium text-dark md:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
      </button>

      <div className="mt-6 flex gap-6">
        <aside className="hidden w-72 shrink-0 md:block">
          <FilterPanel {...filterPanelProps} />
        </aside>

        <div className="flex-1">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dark/10 bg-white py-16 text-center">
              <p className="text-dark/60">No batteries match your search</p>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sorted.map((battery) => (
                <BatteryCard key={battery.id} battery={battery} />
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultCount={sorted.length}
        {...filterPanelProps}
      />
    </div>
  );
}
