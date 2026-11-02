# Specification — Tyre Module

Status: **Stage 1 draft — awaiting approval.** No application code has been written against this spec yet. Companion to `docs/SPEC.md` (battery module) — everything there about data storage rules, engineering rules, and the site frame still applies; this file only covers what's new or different for tyres.

## Assumptions made without sign-off (flag before Phase 1)

These three decisions were defaulted because the question timed out — easy to change now, expensive after data/routes exist:

1. **Service slug/name:** `car-tyre-replacement`, display name "Car Tyre Replacement" — matches the existing `car-battery-replacement` naming exactly.
2. **Brand data:** a separate `data/tyreBrands.json`, independent of `data/brands.json` — mirrors the existing `batteries.json` / `brands.json` pairing rather than merging brand lists.
3. **Fitment model:** tyre compatibility is computed by **size match**, not a hand-maintained map. Each car record gets a new `tyreSize` field; `lib/tyreCompat.js` finds tyres whose `size` equals the car's `tyreSize`. (Battery fitment used an explicit `compat.json` map because battery compatibility isn't reducible to one field; tyre compatibility genuinely is.)

If any of these should change, say so before Phase 1 of `docs/TYRES-PHASES.md` starts — the schema and route names below all depend on them.

---

## What's reused as-is from the battery build

No changes needed to: `lib/db.js`, `CartContext`/`WishlistContext`, `/api/leads`, `Header`, floating call/WhatsApp buttons, `app/sitemap.js`/`app/robots.js` mechanics (they gain more entries, not new logic), `data/faqs.json` schema (already supports multiple `page` values), `data/areas.json` and the area half of `data/cars.json` (name/make/model/year/popularity — shared across services).

`NavTabs.jsx`'s "Tyres" slot (`components/layout/NavTabs.jsx:12`) is already reserved and inert, waiting for this build; same for the footer link note in `components/layout/Footer.jsx:5`.

---

## A. Data storage — new/changed files

| File | Purpose | Status |
|---|---|---|
| `data/tyres.json` | tyre products | new |
| `data/tyreBrands.json` | tyre brands | new |
| `data/tyre-combo-notes.json` | hand-written notes for tyre area×car combos, keyed `"areaSlug__carSlug"` | new — kept separate from `combo-notes.json` so a battery note and a tyre note for the same area+car pair don't collide on one key |
| `data/cars.json` | add `tyreSize` and `tyreDataVerified` fields to every existing record; add `commonTyreIssues: string[]` | **changed** (additive — existing fields untouched) |
| `data/services.json` | add second entry: `{ slug: "car-tyre-replacement", name: "Car Tyre Replacement", shortDescription, active: true }` | **changed** (additive) |
| `data/orders.json` schema | item records gain `productType` (`"battery"` \| `"tyre"`) and `tyreId`, alongside the existing `batteryId` | **changed** (additive, backward compatible — existing battery orders keep working unchanged) |
| `data/faqs.json` | add entries tagged `"page": "car-tyre-replacement"` | additive data only, no schema change |

Full field tables in `docs/TYRES-DATA-SCHEMA.md`.

### Why `tyreDataVerified` is separate from `dataVerified`

`dataVerified` (existing) gates `batteryType`/`groupSize`/`startStop` — real electrical fitment facts sourced from the business owner. `tyreSize` is a different fact sourced independently and may be verified on a different timeline, so it gets its own flag rather than overloading the existing one. Same `"SAMPLE — verify"` rendering rule applies: any page showing `tyreSize` must show the tag until `tyreDataVerified: true`.

### New helper modules

`lib/tyres.js`, `lib/tyreBrands.js`, `lib/tyreCompat.js`, `lib/tyreCombos.js` (tyre equivalent of `lib/combos.js` — same `isIndexable`-shaped gate, see `docs/TYRES-SEO-RULES.md`), `lib/tyreComboNotes.js`.

`lib/orders.js` gets extended (not replaced) to branch on `productType`, recomputing price from `tyres.json` for tyre items and `batteries.json` for battery items — same "never trust client price" rule as today.

### `scripts/validate-data.js` — new checks

- Every `tyres[].brand` resolves to a `tyreBrands[].name`.
- Every `cars[].tyreSize` is a non-empty, well-formed size string (e.g. matches `/^\d{3}\/\d{2}R\d{2}$/`).
- No duplicate keys in `tyre-combo-notes.json`; both halves of every key resolve to real slugs (same check as `combo-notes.json`).
- `services.json` slugs remain unique including the new `car-tyre-replacement` entry.

---

## B. Data schemas

Full field-level detail in `docs/TYRES-DATA-SCHEMA.md`. Summary:

- **`tyres.json`** record: `id, slug, brand, name, size, width, profile, rimDiameter, speedRating, loadIndex, type (Economy/Performance/SUV/RunFlat), price, compareAtPrice, rating, reviewCount, treadWarrantyKm, stock, badge, images[], description`.
- **`tyreBrands.json`** record: same shape as `brands.json` — `slug, name, logo, description, warrantyMonths`.
- **`cars.json` additions**: `tyreSize` (string, e.g. `"205/55R16"`), `tyreDataVerified` (boolean), `commonTyreIssues` (string[]).

---

## C. Site frame changes

- `NavTabs.jsx`: give the "Tyres" entry `href: "/car-tyre-replacement"`, removing it from the inert/disabled branch.
- `Footer.jsx`: add the new service's real links (service hub, `/tyres` listing) to the footer link list the inline comment already warns must only contain real routes.
- No other site-frame changes — header, floating buttons, cart/wishlist contexts are service-agnostic already.

---

## D. Tyre module (mirrors §D of `docs/SPEC.md`)

### `TyreCard`

Same shape as `BatteryCard` (`components/battery/BatteryCard.jsx`): fixed-aspect image, wishlist heart, Add to Cart tab, name/price/badges, delivery-time line computed client-side post-mount. Swap battery-specific fields (`capacityAh`, `cca`) for tyre-specific ones (`size`, `speedRating`). Lives in `components/tyre/TyreCard.jsx`.

### `/tyres` listing page

Same structure as `/batteries` (`components/battery/BatteryGrid.jsx`, `FilterPanel.jsx`, `MobileFilterDrawer.jsx`): search, filters, sort, URL param sync, mobile drawer. Facets swap `Brand`/`Battery Type`/`Capacity` for `Brand`/`Tyre Type`/`Size`. Search matches brand, name, and size (accepting `"205/55/16"`, `"205 55 16"`, and `"205/55R16"` as equivalent, same normalization approach as the existing `"45ah"`/`"45 ah"` rule).

### `/tyres/[slug]` detail page

Same shape as `/batteries/[slug]`: gallery, info cells (service time, installation, warranty — reworded to tread warranty), price, quantity stepper, Add to Cart / Buy now actions, `Product` JSON-LD.

### `/tyre-brand/[brand]` pages

Separate route from `/brand/[brand]` (which lists `brands.json` battery brands) because `tyreBrands.json` is a separate list with its own slug namespace — a collision between a battery brand slug and a tyre brand slug must not silently merge two unrelated brand pages.

---

## E. Programmatic SEO pages (service × area × car) — tyre service

Same mechanism as `docs/SPEC.md` §E and `docs/SEO-RULES.md`, with `car-tyre-replacement` as the service slug and `lib/tyreCombos.js`'s gate instead of `lib/combos.js`'s. Full detail in `docs/TYRES-SEO-RULES.md` — do not duplicate changes here without updating that file too.

### URL structure

```
/car-tyre-replacement                    service hub            (1 page)
/car-tyre-replacement/[area]             area pages              (~300 pages, same areas.json)
/car-tyre-replacement/car/[car]          car pages                (~100 pages, same cars.json)
/car-tyre-replacement/[area]/[car]       area × car combos       (up to ~30,000 possible)
```

`areas.json` and `cars.json` are the **same files** used by the battery service — one area/car list serves both verticals. The `"car"` reserved-segment rule already enforced by `validate-data.js` covers this automatically since it's a property of the shared data, not something scoped per-service.

---

## F. Quote form and leads/orders

- `ContactForm` is reused unchanged — no schema change needed on `leads.json` (the existing `source` field, which captures the submitting page's path, already distinguishes a tyre-page lead from a battery-page lead).
- `/api/orders` is extended, not replaced: items gain `productType`/`tyreId` per §A above; totals still recomputed server-side, now from either `batteries.json` or `tyres.json` depending on `productType`.

---

## G. Engineering rules

Same as `docs/SPEC.md` §G — Server Components by default, `next/image` everywhere, one `<h1>` per page, mobile-first Tailwind, accessible labels, no scope creep beyond this spec without checking in first.
