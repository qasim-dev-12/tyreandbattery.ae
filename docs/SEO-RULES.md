# SEO Rules — Programmatic Service × Area × Car Pages

This is the authoritative spec for the programmatic SEO system described in `docs/SPEC.md` §E. If the two ever disagree, this file wins for SEO mechanics; `SPEC.md` wins for everything else.

The entire point of this system: **generate pages from real underlying data at render time, never store the permutations themselves, and never index a page that doesn't carry genuinely unique, useful content.** Search engines penalize thin/duplicate programmatic pages, so the quality gate in this document is not optional polish — it's the thing that keeps the whole approach from backfiring.

---

## URL structure

```
/car-battery-replacement                    service hub            (1 page)
/car-battery-replacement/[area]              area pages             (~300 pages)
/car-battery-replacement/car/[car]           car pages               (~100 pages)
/car-battery-replacement/[area]/[car]        area × car combos      (up to ~30,000 possible)
```

- `car` is a **reserved literal path segment**. No `areas.json` entry may use the slug `car` — `validate-data.js` enforces this so `/car-battery-replacement/car/...` can never collide with an area page.
- The service slug itself (`car-battery-replacement`) comes from `data/services.json`; only `active: true` services get routes generated.

---

## Indexing tiers

### Tier 1 — service × area (`/car-battery-replacement/[area]`)

Always indexed. Content is built entirely from real per-area data (`landmarks`, `parkingNote`, `responseMinutes`, `nearbyAreas`) plus the service hub copy — every page is inherently unique because every area record is unique.

### Tier 2 — service × car (`/car-battery-replacement/car/[car]`)

Always indexed. Content is built from real per-car data (`batteryType`, `groupSize`, `startStop`, `commonIssues`) plus compatible batteries pulled live from `compat.json` / `batteries.json`.

### Tier 3 — area × car (`/car-battery-replacement/[area]/[car]`)

**Indexable only if `lib/combos.js`'s `isIndexable(car, area)` returns `true`.** The gate:

```
isIndexable(car, area) =
     compat.json has at least one battery id for car.slug
  AND area.landmarks.length >= 2
  AND area.parkingNote is non-empty
  AND (
        a note exists at combo-notes[`${area.slug}__${car.slug}`]
        OR (car.popularity >= 7 AND area.demand >= 6)
      )
```

- **Pages that fail the gate still render for users** (so a direct visitor or internal link never 404s) — they just carry `<meta name="robots" content="noindex,follow">`, are excluded from the sitemap, and are never linked from navigation, the area page's "top cars" list, or the car page's "nearby areas" list.
- **Pages that pass the gate** get normal indexable metadata (no `noindex`), a canonical URL, and are included in the sitemap and internal link graph.

---

## Rendering strategy

- `generateStaticParams` for Tier 3 pre-renders only the **top 1,000 combos**, ranked by `area.demand * car.popularity` (descending). This keeps build time bounded even as the full `cars` × `areas` space grows toward 30,000.
- `dynamicParams = true` so any combo outside the top 1,000 still renders on first request (and is cached thereafter) instead of 404ing.
- `revalidate = 86400` (24 hours) on Tier 3 pages — the underlying data (prices, stock) can change daily without a full rebuild.
- Tier 1 and Tier 2 pages are fully static (`generateStaticParams` covers all of them; counts are bounded at ~300 and ~100).

---

## Content uniqueness rules

Every generated page — Tier 1, 2, and 3 — must satisfy all of these. This is a **no synonym-swap templates** rule: the goal is pages that differ because the underlying facts differ, not pages that differ because a thesaurus swapped a few words.

1. **Real compatible batteries** pulled from `batteries.json` via `compat.json`, with real live price and stock — never hardcoded or templated product mentions.
2. **Real car facts**: battery type, group size, start-stop, common issues — shown with the `"SAMPLE — verify"` tag per `docs/DATA-SCHEMA.md` until `dataVerified: true`.
3. **Real area facts**: landmarks, parking style, response time.
4. **A different nearby-areas list** (from `area.nearbyAreas`) and **a different related-cars list** (same `make` or same `batteryType` as the current car) computed per page — never the same fixed list site-wide.
5. **`combo-notes.json` text when available** — these hand-written notes are the highest-quality content on Tier 3 pages and should be surfaced prominently when present.
6. **Different FAQ selections** per page, driven by car and area attributes (e.g. a `startStop: true` car pulls in a start-stop-specific FAQ; a high-`demand` area pulls in a response-time FAQ) rather than the same static FAQ block everywhere.
7. **Deterministic template variants**: sentence structure/paragraph order for the generated copy is chosen by hashing the page's slug (e.g. `hash(areaSlug + carSlug) % N` selects one of `N` phrasing variants) — the same page always renders the same variant (so content doesn't shuffle on every request/rebuild), but different pages are structurally varied, not just word-swapped.
8. **Structured data**: `Service` JSON-LD with `areaServed` and `provider`, plus `BreadcrumbList` JSON-LD, on every page. `FAQPage` JSON-LD **only** for the FAQs actually visible on that page. Every JSON-LD value must match what's visibly rendered — no schema claiming content that isn't on the page.
9. **Internal links**:
   - Area page → links to its top cars (by popularity, restricted to cars with at least one compatible battery in that context).
   - Car page → links to its nearby high-demand areas.
   - Combo page → links to its parent area page, parent car page, and the service hub.
   - **Only indexable (gate-passing) Tier 3 pages are ever linked to** — a noindex page is reachable by direct URL but never appears in these link lists.

---

## Sitemap and robots

- `app/sitemap.js` uses `generateSitemaps()` to shard output, capped at **50,000 URLs per sitemap file** (Next.js/Google's hard limit).
- Only indexable URLs are included: the hub, all Tier 1 and Tier 2 pages, and only the Tier 3 pages that currently pass `isIndexable`.
- `app/robots.js` references the sitemap index and disallows crawling of non-public routes (e.g. `/admin/**`).
- Because `isIndexable` depends on live data (`compat.json`, `combo-notes.json`, popularity/demand values can change), the sitemap is computed at request time from current data — it is never a cached/stale snapshot baked in at build time for long-lived deployments.

---

## Dev-only SEO report

`/admin/seo-report` (blocked in production via an environment check — returns 404 or redirects when `NODE_ENV === "production"`):

- Total Tier 3 combos possible (`cars.length * areas.length`).
- Count indexable vs noindex, with the reason the noindex ones failed the gate (missing compat, insufficient landmarks, missing parking note, and popularity/demand/note condition unmet).
- List of areas and cars with missing or `dataVerified: false` data, so content gaps are visible at a glance.

---

## Quick reference — what makes a Tier 3 page indexable

| Condition | Required |
|---|---|
| At least 1 compatible battery for the car | Yes, always |
| Area has ≥ 2 landmarks | Yes, always |
| Area has a non-empty parking note | Yes, always |
| Hand-written combo note exists | Either this... |
| `car.popularity >= 7 AND area.demand >= 6` | ...or this |

Fail any "always" row → `noindex,follow`, excluded from sitemap, not internally linked, but still rendered for direct visitors.
