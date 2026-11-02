# Battery × Area Permutation

Status: **approved, implementing now.** This is the companion to `docs/PERMUTATION.md`
(service × area × car) — it covers the two new tiers requested on top of that: service ×
area × battery (SKU) and service × area × brand. Scoped to Dubai first, same as the
existing system (`data/areas.json` is already Dubai-only).

It does **not** replace or touch the existing service × area × car pages.

---

## The idea

Existing permutation: **service × area × car** (fitment-based — "does this car take a
battery we stock"). New permutations:

- **service × area × battery (SKU)** — product-based: "can we deliver/fit this specific
  battery in this area" — e.g. `car-battery-replacement in Al Barsha with Brand B
  MaxCharge 86Ah`.
- **service × area × brand** — broader than one SKU: "does this brand have a real
  presence in this area" — e.g. `car-battery-replacement in Al Barsha with Bosch
  batteries`.

Battery and brand are **two separate 2-way tiers**, not one 3-way `area × battery ×
brand` multiply — every battery already resolves to exactly one brand
(`docs/DATA-SCHEMA.md`), so multiplying all three together would mostly generate
nonsense pairs (a Brand A battery on a Brand G-branded page). Keeping them separate also
avoids the 360,000-combo blow-up a true 4-way `service × area × car × brand` permutation
would produce, which was ruled out earlier as unworkable (no `car → brand` data, and
spam-level indexing risk).

## The math (current data)

| Combination | Count | Route |
|---|---|---|
| service × area | 300 (existing, Tier 1) | `/car-battery-replacement/[area]` |
| service × battery (SKU) | 40 (new) | `/car-battery-replacement/battery/[battery]` |
| service × brand | 12 (existing, standalone) | `/brand/[brand]` — reused as-is |
| **service × area × battery (SKU)** | 300 × 40 = **12,000** | `/car-battery-replacement/[area]/battery/[battery]` |
| **service × area × brand** | 300 × 12 = **3,600** | `/car-battery-replacement/[area]/brand/[brand]` |
| **New battery-permutation total** | 12,000 + 3,600 = **15,600** | — |
| Grand total incl. existing car system | 15,600 + 30,000 (`docs/PERMUTATION.md`) = **45,600** raw combos | — |

No new standalone "service × brand" page — `/brand/[brand]` already serves that role
(`docs/SPEC.md` §Brand pages). The new area×brand combo pages link up to it as their
parent.

## Reserved path segments (decision)

Mirrors how `car` is reserved today so `/car-battery-replacement/car/...` can't collide
with an area slug:

- `battery` is reserved under the hub (`/car-battery-replacement/battery/...`) — no
  `areas.json` slug may be `battery` (same rule `car` already has).
- `battery` and `brand` are reserved as **car slugs** — since the existing car combo
  route is the bare `/car-battery-replacement/[area]/[car]`, a car slug of `battery` or
  `brand` would collide with `/car-battery-replacement/[area]/battery/...` and
  `/car-battery-replacement/[area]/brand/...`. `validate-data.js` enforces this.
- Battery slugs and brand slugs never collide with each other since they sit under
  different reserved parents (`battery/` vs `brand/`).

## `combo-notes.json` key scheme (decision)

Reusing the existing file with namespaced keys rather than adding new files — keeps one
place for all hand-written combo content:

- Car combo (existing, unchanged): `${areaSlug}__${carSlug}`
- Battery combo (new): `${areaSlug}__battery__${batterySlug}`
- Brand combo (new): `${areaSlug}__brand__${brandSlug}`

`validate-data.js`'s combo-notes check is extended to parse both the 2-part (car) and
3-part (battery/brand) key shapes and validate each piece against its source list.

## Quality gate — area × battery (decision)

```
isBatteryIndexableSync(battery, area, comboNotes) =
     battery.stock > 0
  AND area.landmarks.length >= 2
  AND area.parkingNote is non-empty
  AND (
        comboNotes[`${area.slug}__battery__${battery.slug}`] exists
        OR (battery.rating >= 4.3 AND area.demand >= 6)
      )
```

- `battery.stock > 0` replaces the car tier's "a compatible battery exists" check — here
  the SKU itself must be sellable.
- `battery.rating >= 4.3` is the "worth a dedicated page" signal (current data: ratings
  3.6–5.0, median 4.3) — same role `car.popularity >= 7` plays in the car tier. This is a
  tunable constant (`BATTERY_RATING_THRESHOLD` in `lib/combos.js`), not hardcoded inline.
- Area-side conditions are unchanged from the car tier's gate — they describe the area,
  not the product.

## Quality gate — area × brand (decision)

```
isBrandIndexableSync(brand, area, batteries, comboNotes) =
     batteries.some(b => b.brand === brand.name AND b.stock > 0)
  AND area.landmarks.length >= 2
  AND area.parkingNote is non-empty
  AND (
        comboNotes[`${area.slug}__brand__${brand.slug}`] exists
        OR area.demand >= 6
      )
```

`data/brands.json` has no popularity/ranking field (unlike `car.popularity` or a
battery's `rating`), so this gate leans on area demand alone plus real in-stock
inventory. Not adding a new brand popularity field right now — out of scope for this
pass; revisit if indexed volume needs tighter control later.

## Rendering strategy (decision — updated)

Unlike the 30,000 area×car combos (which need the top-1,000 + on-demand split to keep
build time bounded), **every** area×battery and area×brand combo is now pre-rendered at
build time — 12,000 + 3,600 = 15,600 pages, all generated by `generateStaticParams`, no
ranking/cap/`dynamicParams` fallback needed. `revalidate = 86400` is kept on both so stale
stock/price data still refreshes daily without a full rebuild.
- Tier 2 battery pages (`/car-battery-replacement/battery/[battery]`) are fully static —
  only 40 of them, same as the car tier.

This trades build time for having every URL exist as a real static file from deploy
onward (no "first visitor pays the render cost" cold path). `rankBatteryCombos` /
`rankBrandCombos` were removed from `lib/combos.js` — they only existed to support the
top-N ranking this supersedes.

## Content uniqueness

Same no-templating rule as `docs/SEO-RULES.md` content-uniqueness rules, applied to the
new facts available:

- Battery+area pages: real per-SKU facts (price, stock, rating, warranty, capacity,
  CCA, type) + real per-area facts (landmarks, parking, response time). Deterministic
  template variants via `pickVariant(areaSlug + batterySlug)`, same mechanism as car
  combos.
- Brand+area pages: brand description/warranty + count and range of that brand's SKUs
  actually in stock, + the same real per-area facts.
- These sit **alongside**, not instead of, the existing "compatible batteries" list on
  car combo pages and the Tier 1 area page — different angle (SKU/brand-specific vs
  fitment-specific), so no duplicate-content conflict as long as copy differs
  structurally, which the variant mechanism guarantees.

## Internal linking (decision)

- Tier 1 area page → adds a "Featured batteries in this area" list (indexable battery
  combos only) and a "Brands available in this area" list (indexable brand combos only),
  alongside the existing "Popular cars" list. Non-indexable combos fall back to the
  parent Tier 2 page (battery) or `/brand/[brand]` (brand), same pattern as the existing
  car fallback.
- Tier 2 battery page → adds a "Areas we cover" list linking to its indexable area
  combos, mirroring the car Tier 2 page.
- Battery/brand combo pages link up to their parent area page, parent battery/brand page,
  and the service hub.
- Sitemap and admin SEO report are extended to include/report the two new tiers.
- **Hub page** (`/car-battery-replacement`) → adds "Browse by Battery" and "Browse by
  Brand" sections (top 8 each) alongside the existing "Browse by Area"/"Browse by Car",
  each with a "View all" link into a new directory page — closing the same "no click
  path" gap `docs/RELATION.md` already fixed for area/car.
- **New directory pages**, mirroring `docs/RELATION.md` Steps 1/2/4 for the car tier:
  - `/car-battery-replacement/battery` — all 40 batteries grouped by brand, each with a
    "serving [area] →" link into its highest-demand indexable area combo, where one
    exists.
  - `/car-battery-replacement/brand` — all 12 brands with the same "serving [area] →"
    pattern into the area×brand combo tier. (Distinct from `/brand/[brand]`, the existing
    per-brand product listing, which this page links to for each brand's own page.)
  - Both reserved as literal segments the same way `car`/`areas`/`battery` already are —
    `brand` is now also checked against area slugs in `validate-data.js`.
