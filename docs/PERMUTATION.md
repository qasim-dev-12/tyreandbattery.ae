# Permutation Pages — Service × Area × Car

This file explains, in plain terms, the programmatic page system built in Phases 7–9 and scaled up in Phase 11. It's a companion to `docs/SEO-RULES.md` (the detailed rulebook) and `docs/DATA-SCHEMA.md` (the field-level schema) — read those for the exact mechanics; this one is the "why and how much" overview.

## The idea

We sell one service today: **car battery replacement**. Customers search for it combined with *where they are* (an area) and *what they drive* (a car). Instead of writing one page per combination by hand, we store three small lists and let the site generate every combination automatically:

- `data/services.json` — the service(s) we offer (currently 1: `car-battery-replacement`)
- `data/areas.json` — every area we serve (target: 300)
- `data/cars.json` — every car model we support (target: 100)
- `data/compat.json` — which batteries actually fit which car (this is what keeps a car page honest — no inventory, no page content claiming otherwise)

Nothing about a specific area+car *pair* is ever stored — the pair's page is built from the three lists plus (optionally) a hand-written note in `data/combo-notes.json`, at request/build time.

## The math

| Combination | Count at full scale | Route |
|---|---|---|
| service × area | 1 × 300 = **300** | `/car-battery-replacement/[area]` |
| service × car | 1 × 100 = **100** | `/car-battery-replacement/car/[car]` |
| service × area × car | 1 × 300 × 100 = **30,000** | `/car-battery-replacement/[area]/[car]` |

The first two rows are always built and always indexed — every area and every car gets a real page, full stop, because every area and every car record is genuinely unique real data.

The third row is the big one, and it's **not** treated the same way. 30,000 auto-generated pages where most of them are thin or redundant is exactly the kind of thing search engines penalize. So instead of indexing all 30,000, every combo page is checked against a quality gate first.

## The quality gate (why 30,000 ≠ 30,000 indexed pages)

A combo page (`area` × `car`) only gets indexed if:

```
at least 1 compatible battery exists for that car (data/compat.json)
AND the area has ≥ 2 landmarks and a parking note
AND ( a hand-written note exists for this exact area+car pair
      OR  car.popularity >= 7 AND area.demand >= 6 )
```

Pages that fail this still **render normally** for anyone who visits the URL directly — they just carry a `noindex` tag, aren't in the sitemap, and aren't linked from anywhere on the site. Pages that pass get indexed normally with full SEO metadata. The exact logic lives in `lib/combos.js`'s `isIndexable()`; the full rationale is in `docs/SEO-RULES.md`.

At our current sample data (15 cars / 30 areas = 450 combos), roughly 40% pass the gate. At full scale (100 × 300 = 30,000), expect a similar proportion to actually get indexed — the rest still exist and still work, they just aren't spammed at Google.

## Rendering strategy at 30,000 pages

Pre-building all 30,000 pages at every deploy would make builds slow for little benefit — most of the long tail gets little traffic. So:

- The **top 1,000** combos (ranked by `area.demand × car.popularity`) are pre-built at deploy time (`generateStaticParams`).
- Every other combo renders on its **first real visit** instead (`dynamicParams = true`), then stays cached for 24 hours (`revalidate = 86400`).

Nobody gets a 404 for a valid area+car pair — it either was already built, or gets built the moment someone (or Google) asks for it.

## Where the data actually lives

Everything above reads from flat JSON files via `/lib` helpers — there is no database (see `docs/SPEC.md` §A for why). Concretely:

- `lib/areas.js`, `lib/cars.js` — read/list the two base lists
- `lib/compat.js` — the car → battery-ids map
- `lib/combos.js` — `isIndexable()` (the gate) and `rankCombos()` (the top-1,000 ranking)
- `lib/jsonld.js`, `lib/templateVariant.js`, `lib/faqs.js` — the pieces that keep 30,000 auto-generated pages from reading like 30,000 copies of the same paragraph (see `docs/SEO-RULES.md` "Content uniqueness rules")

## Scaling the data up

`data/cars.json` and `data/areas.json` can be grown two ways:

1. **CSV import** — `npm run import:cars` / `npm run import:areas`, reading `data/imports/cars.csv` / `areas.csv` (see `README.md`). This is the path for real data you supply.
2. **One-off generator** — used for the Phase 11 scale test specifically, to produce 100/300 *placeholder* records so the build/validate/sitemap pipeline can be proven out before real data exists.

Either way, every car record is tagged `dataVerified: false` until its fitment fields (`batteryType`, `groupSize`, `startStop`) are confirmed against real data — see `docs/DATA-SCHEMA.md`. Scaling the row *count* up doesn't change that rule.
