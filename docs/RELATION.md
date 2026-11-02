ho# Relation — Exposing Service × Area × Car in the UI

Status: **plan — not yet implemented.** This file exists so we build the fix step by step, reviewing after each step, instead of all at once.

## The math (unchanged)

| Combination | Pages | Route |
|---|---|---|
| service × area (1 × 300) | 300 | `/car-battery-replacement/[area]` |
| service × car (1 × 100) | 100 | `/car-battery-replacement/car/[car]` |
| service × car × area (1 × 100 × 300) | 30,000 | `/car-battery-replacement/[area]/[car]` |

All 300 + 100 + 30,000 pages exist and render correctly (confirmed in Phase 11). The problem isn't that they don't exist — it's that most of them have **no click path** in the UI today.

## Where this lives in the files, today

| Combination | Page file | Data it reads | Static params from |
|---|---|---|---|
| service × area (300) | `app/car-battery-replacement/[area]/page.js` | `data/areas.json` via `lib/areas.js` (`getAllAreas`, `getAreaBySlug`) | `getAllAreas()` — one param per area, all 300 |
| service × car (100) | `app/car-battery-replacement/car/[car]/page.js` | `data/cars.json` via `lib/cars.js` (`getAllCars`, `getCarBySlug`) | `getAllCars()` — one param per car, all 100 |
| service × car × area (30,000) | `app/car-battery-replacement/[area]/[car]/page.js` | `data/compat.json` + `data/combo-notes.json` via `lib/combos.js` (`rankCombos`, `isIndexable`) | `rankCombos(cars, areas)` — only the top 1,000 pre-built; rest render on demand (`dynamicParams = true`) |

Supporting pieces:
- **Hub links** ("Browse by Area" / "Browse by Car", today's top-8-only lists): `app/car-battery-replacement/page.js`, using `lib/areas.js`'s `getTopAreas()` and `lib/cars.js`'s `getTopCars()`.
- **Per-page top-6 lists** ("Popular cars we service" on area pages, "Areas we cover" on car pages): built inline in the same two page files above, same `getTopAreas`/`getTopCars` calls — this is *why* they show the same ranking everywhere, since nothing area- or car-specific feeds into that ranking today.
- **Sitemap** (the only current path to the long tail): `lib/sitemapEntries.js` → `app/sitemap.js`.
- **Indexability gate**: `lib/combos.js`'s `isIndexable()` / `isIndexableSync()`.
- **Reserved route segment**: `"car"` is reserved as a literal folder (`app/car-battery-replacement/car/`) so it can never collide with an `[area]` value — enforced in `scripts/validate-data.js`.

## The gap, precisely

Right now, on-site navigation only ever shows the *top* N by ranking:

| Where | Shows | Out of |
|---|---|---|
| Hub page "Browse by Area" | top 8 areas by `demand` | 300 |
| Hub page "Browse by Car" | top 8 cars by `popularity` | 100 |
| Each area page "Popular cars we service" | top 6 cars by `popularity` (same global ranking every time) | 100 |
| Each car page "Areas we cover" | top 6 areas by `demand` (same global ranking every time) | 300 |
| Combo pages | never linked from anywhere except the sitemap | 30,000 |

Net effect: roughly **92 of 100 car pages** and the large majority of the **300 area pages** have zero on-site click path. The only way in is a direct URL, the sitemap (`/sitemap/0.xml`), or a search engine that already crawled the sitemap. That's not nothing — it's exactly what the sitemap is for — but it means a real visitor clicking around the site can never actually reach most of these pages, and internal links carry more weight for SEO than a sitemap entry alone.

## The plan

Four steps, each reviewable on its own before moving to the next.

### Step 1 — "All Areas" index page

**New file:** `app/car-battery-replacement/areas/page.js`, at `/car-battery-replacement/areas`.

Lists all 300 areas grouped by their base name (the 50 real-sounding names each split into sectors — "Downtown 1" through "Downtown North", etc.) so it reads as a directory, not a wall of 300 flat links. Linked from the hub's "Browse by Area" section ("View all 300 areas →") in `app/car-battery-replacement/page.js`.

**Side effect:** `"areas"` needs to become a second reserved slug alongside `"car"` — add a literal `app/car-battery-replacement/areas/` folder (same trick already used for `car/`) and add the same check to `scripts/validate-data.js` so no real area can ever be named `areas`.

### Step 2 — "All Cars" index page

**New file:** `app/car-battery-replacement/car/page.js`, at `/car-battery-replacement/car`.

`"car"` is already a reserved literal segment (see the table above) with its own subfolder `car/[car]/` for individual car pages — Next.js supports a `page.js` directly inside `car/` *and* a `[car]/` subfolder side by side, so this needs no new reserved word, just the new file. Lists all 100 cars grouped by make. Linked from the hub's "Browse by Car" section ("View all 100 cars →") in `app/car-battery-replacement/page.js`.

### Step 3 — Area ↔ Car pages link to real combos, not just each other

**Files to change:** `app/car-battery-replacement/[area]/page.js` and `app/car-battery-replacement/car/[car]/page.js` (the "Popular cars we service" / "Areas we cover" blocks in each) — plus they'll need `isIndexable()` from `lib/combos.js` imported in to check each candidate pair before linking to it.

Today, an area page's "Popular cars" links to the *car's own Tier 2 page* (`/car-battery-replacement/car/[car]`), not to the area+car combo. Change this to link to the **combo page** (`/car-battery-replacement/[area]/[car]`) wherever that specific combo is indexable — giving a genuine service×area×car link in the UI, not just two separate service×area and service×car links.

Same change in reverse on car pages: "Areas we cover" links to the combo page for that specific area+car pair where indexable.

**Rule carried over from `docs/SEO-RULES.md`:** only ever link to a combo page that passes `isIndexable()`. A noindex combo stays reachable by direct URL/sitemap only, never linked from navigation. This step doesn't change that rule — it just means the "top cars/areas" links now point one level deeper (into the combo) instead of stopping at the car/area page, for the subset where that combo is actually worth sending someone to.

### Step 4 — Full index pages link onward too

**Files to change:** `app/car-battery-replacement/areas/page.js` and `app/car-battery-replacement/car/page.js` (the two new files from Steps 1–2).

Each area/car entry in those index pages can show a small "top compatible combo" link alongside it where one exists and is indexable, extending Step 3's pattern to the long tail instead of just the top 8.

## What stays the same

- The `isIndexable()` gate itself is not changing — this is purely about which *already-indexable* pages get a real link pointed at them, and giving every area/car page at least one way to be reached without typing a URL.
- No new data files, no schema changes — this is UI/linking only, built from data that already exists (`lib/areas.js`, `lib/cars.js`, `lib/combos.js`).
