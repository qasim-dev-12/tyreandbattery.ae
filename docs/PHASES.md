# Build Phases

Work proceeds one phase at a time. After each phase: stop, report what was built, give the "how to test" steps below, and wait for review before starting the next phase. Full detail for everything referenced here lives in `docs/SPEC.md`, `docs/DATA-SCHEMA.md`, and `docs/SEO-RULES.md`.

---

## Phase 1 — Data layer

**Build**
- Sample data: 40 batteries (fictional brands "Brand A"–"Brand L"), 15 cars, 30 areas, `compat.json`, `combo-notes.json` (a few entries), `faqs.json`, `site.json`, `services.json` (one active service).
- `lib/db.js` with atomic writes, write lock, default-on-missing.
- All `lib/*.js` helpers listed in `docs/SPEC.md` §A.
- `scripts/validate-data.js` → `npm run validate`.
- `scripts/import-csv.js` → `npm run import:cars`, `npm run import:areas`.

**Acceptance criteria**
- `npm run validate` exits 0 on the shipped sample data.
- Every helper function listed in the spec exists and returns data matching `docs/DATA-SCHEMA.md`.
- No component/page anywhere imports a JSON file directly (only `lib/*.js` does).
- Sample car records missing verified fitment data are flagged `dataVerified: false`.

**How to test**
```
npm run validate
```
Should print no errors and exit 0. Optionally run a throwaway script that calls each `lib/*.js` export and logs the result shape.

---

## Phase 2 — Site frame

**Build**
- `Header` (logo, nav pills, search icon, Login, cart badge, sticky).
- Floating call/WhatsApp buttons with pulsing halo (desktop) + sticky bottom bar (mobile).
- `CartContext`, `WishlistContext` with `localStorage` persistence.

**Acceptance criteria**
- Header renders site name/phone from `data/site.json` via `lib/site.js`, nothing hardcoded.
- Cart badge updates when context state changes; persists across a page reload.
- Floating buttons use real `tel:`/`wa.me` links built from `site.json`.
- Only the components that need interactivity are `"use client"`.

**How to test**
```
npm run dev
```
Visit `/`. Confirm header is sticky, nav pill highlights correctly, floating buttons appear bottom-right with a pulsing halo on desktop and collapse to a bottom bar on a mobile-width viewport. Add/remove a dummy cart item via devtools or a temp test button, reload, confirm it persists.

---

## Phase 3 — Hero, BatteryCard, featured carousel

**Build**
- `Hero` on `/car-battery-replacement`.
- `BatteryCard`.
- Featured batteries carousel (6–8 cards) on the same page.

**Acceptance criteria**
- Hero copy comes entirely from `site.json`.
- `BatteryCard`'s delivery-time line only appears after client mount (no hydration warning in console).
- Clicking Add to Cart or the wishlist heart does not navigate; clicking elsewhere on the card does.
- Carousel: left arrow hidden until scrolled, right arrow hidden at scroll end, buttons use `scrollBy`.

**How to test**
```
npm run dev
```
Visit `/car-battery-replacement`. Check browser console for hydration warnings (should be none). Scroll the carousel and confirm arrow visibility logic. Click a card's Add to Cart button and confirm the page does not navigate and the cart badge increments.

---

## Phase 4 — `/batteries` listing

**Build**
- `BatteryGrid` with search, sort, filters, URL param sync, mobile filter drawer.

**Acceptance criteria**
- "N products found" count always matches the rendered grid.
- Search matches `"45ah"` and `"45 ah"` against a 45Ah product.
- Changing a filter updates the URL; reloading the URL with query params restores the same filtered/sorted view.
- Empty state appears when a filter combination matches nothing, with a working Clear Filters button.

**How to test**
```
npm run dev
```
Visit `/batteries`. Try the search box, toggle two brand checkboxes and a type checkbox, drag the price slider, change sort order, confirm the URL updates each time. Copy the URL, open it in a new tab, confirm identical state. Shrink the viewport to mobile width and confirm the Filters button opens a slide-over drawer.

---

## Phase 5 — Battery detail + brand pages

**Build**
- `/batteries/[slug]` with gallery, info cells, installments, quantity stepper, actions, `Product` JSON-LD.
- `/brand/[brand]`.

**Acceptance criteria**
- `generateStaticParams` covers all battery slugs; visiting an unknown slug 404s normally.
- Page `<title>`/description are unique per product; canonical tag present.
- View page source (or `view-source:`) shows valid `Product` JSON-LD matching the visible price/name.

**How to test**
```
npm run build && npm run start
```
Visit a few `/batteries/[slug]` pages, confirm unique titles in the browser tab, inspect JSON-LD in page source. Visit `/brand/[a-real-brand-slug]` and confirm it lists only that brand's products.

---

## Phase 6 — Leads API, orders API, ContactForm

**Build**
- `POST /api/leads`, `POST /api/orders`.
- `ContactForm`.

**Acceptance criteria**
- Submitting the form with valid data appends a record to `data/leads.json` with a server-generated `id`/`createdAt`.
- Honeypot field, when filled, causes a silent rejection (no entry written, but no error exposed that reveals the honeypot to a bot).
- `/api/orders` ignores any `price`/`unitPrice` sent by the client and recomputes from `batteries.json`.
- Invalid input returns 400 with a JSON error body; a server failure returns 500.

**How to test**
```
npm run dev
```
Submit the quote form with valid data, confirm success state and a new line in `data/leads.json`. Submit with an empty required field, confirm inline validation blocks it. Using devtools, POST to `/api/orders` with a tampered price for a known battery id, confirm the stored order uses the real price from `batteries.json`, not the tampered one.

---

## Phase 7 — Programmatic pages, Tier 1 and Tier 2

**Build**
- `/car-battery-replacement` hub.
- `/car-battery-replacement/[area]`.
- `/car-battery-replacement/car/[car]`.

**Acceptance criteria**
- Every area page and car page renders real per-record data (no shared boilerplate paragraph).
- No `noindex` on any Tier 1/2 page.
- `car` route segment does not collide with any area slug (validated by Phase 1's script).

**How to test**
```
npm run build
```
Should succeed and statically generate ~300 + ~100 pages (sample-data phase will produce fewer — confirm the count matches `areas.json`/`cars.json` lengths). Spot-check 3 area pages and 3 car pages for distinct content.

---

## Phase 8 — Programmatic pages, Tier 3

**Build**
- `/car-battery-replacement/[area]/[car]` with `isIndexable` gate from `docs/SEO-RULES.md`.

**Acceptance criteria**
- A combo that fails the gate renders normally for a direct visit but has `<meta name="robots" content="noindex,follow">` in its `<head>`.
- A combo that passes the gate has no `noindex` meta and a canonical URL.
- `generateStaticParams` produces at most 1,000 entries, ranked by `area.demand * car.popularity`.
- Visiting a combo outside the pre-rendered 1,000 still renders (via `dynamicParams`), not a 404.

**How to test**
```
npm run build && npm run start
```
Visit a known low-popularity/low-demand combo with no combo-note — confirm `noindex` in page source. Visit a known high-popularity/high-demand combo — confirm no `noindex` and valid JSON-LD. Check `docs/SEO-RULES.md`'s quick-reference table against a couple of hand-picked examples from the data.

---

## Phase 9 — Sitemap, robots, SEO report, internal linking audit

**Build**
- `app/sitemap.js` (sharded via `generateSitemaps()`), `app/robots.js`.
- `/admin/seo-report` (dev-only).

**Acceptance criteria**
- Sitemap contains the hub + all Tier 1/2 pages + only indexable Tier 3 pages; no `noindex` page appears in it.
- No sitemap file exceeds 50,000 URLs (irrelevant at sample-data scale, but the sharding code must be in place and correct).
- `/admin/seo-report` 404s or redirects when built with `NODE_ENV=production`, and in dev shows indexable vs. noindex counts plus a data-gap list.
- Internal links (area → top cars, car → nearby areas, combo → parents) never point to a noindex combo page.

**How to test**
```
npm run dev
```
Visit `/admin/seo-report`, confirm counts look sane against the sample data (every car/area combo accounted for). Spot-check `/sitemap.xml` (or the relevant shard) for a handful of URLs and confirm none of them are pages you confirmed `noindex` in Phase 8. Then run `npm run build && npm run start` and confirm `/admin/seo-report` is not reachable.

---

## Phase 10 — Remaining landing sections

**Build**
- Why us, services, warning signs, diagnosis, jump-start vs replace, how it works, battery types table, heat/climate guide, brands, testimonials (clearly marked placeholder), areas list, FAQ, quote form placement, footer.

**Acceptance criteria**
- Testimonials are visibly labeled as placeholder/sample content (e.g. "Sample testimonial" tag), never presented as real customer quotes.
- FAQ section pulls from `data/faqs.json` via `lib/faqs.js`, filtered by `page`.
- Footer links to real routes only (no dead links to unbuilt pages).

**How to test**
```
npm run dev
```
Scroll the full homepage/service hub top to bottom, click every footer link and confirm none 404, confirm testimonials are clearly marked as placeholders.

---

## Phase 11 — Scale test

**Build**
- Generate 100 cars and 300 areas of placeholder data (via `scripts/import-csv.js` or a one-off generator), run the full pipeline at target scale.

**Acceptance criteria**
- `npm run validate` passes at full scale.
- `npm run build` completes in a reasonable time (report the actual wall-clock time) and the Tier 3 static params cap at 1,000.
- Sitemap sharding is exercised correctly (confirm URL counts per shard, confirm sharding logic would kick in correctly if the count exceeded 50,000, even if it doesn't at this scale).
- `/admin/seo-report` numbers reconcile: indexable + noindex Tier 3 counts sum to `100 * 300 = 30,000`.

**How to test**
```
npm run validate
npm run build
```
Report build duration. Visit `/admin/seo-report` in dev and confirm the indexable/noindex totals sum correctly. Spot-check sitemap output for correct sharding behavior.
