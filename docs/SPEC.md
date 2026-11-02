# Specification — Mobile Car Battery Website

Status: **Stage 1 draft — awaiting approval.** No application code has been written against this spec yet.

## Project context

- Business: tyreandbattery (real name — set in `data/site.json`), mobile car battery replacement in Dubai, UAE (placeholder city/country).
- Currency: AED (placeholder).
- Phone / WhatsApp: +971 50 000 0000 (placeholder — clearly fake, safe to ship until replaced).
- Brand colors: primary `#2563eb`, dark `#0f172a`.
- Stack: Next.js (latest, App Router), JavaScript (no TypeScript), Tailwind CSS, lucide-react.
- Everything — name, logo, text, images — must be original or a clearly marked placeholder. Never copy content, logos, or images from other websites.

All placeholder business details above live in one place (`data/site.json`) so they can be swapped for real values without touching code.

---

## A. Data storage: JSON files, no database

All data lives in `/data`. No component or page imports a JSON file directly — all access goes through helpers in `/lib`, so a database can later replace the JSON files without any UI changes.

### Files

| File | Purpose |
|---|---|
| `data/site.json` | business name, phone, WhatsApp, address, socials, currency, city, hero copy, trust badges |
| `data/batteries.json` | products |
| `data/brands.json` | battery brands |
| `data/services.json` | starts with one service, `car-battery-replacement`; structured so tyres, oil change, etc. can be added later |
| `data/cars.json` | ~100 cars (sample phase ships 15; see PHASES.md) |
| `data/areas.json` | ~300 areas (sample phase ships 30; see PHASES.md) |
| `data/compat.json` | `carSlug -> array of compatible battery ids` |
| `data/combo-notes.json` | optional hand-written notes keyed `"areaSlug__carSlug"` |
| `data/faqs.json` | FAQ entries, tagged by page/context |
| `data/leads.json` | starts as `[]`, appended to by `/api/leads` |
| `data/orders.json` | starts as `[]`, appended to by `/api/orders` |

`data/leads.json` and `data/orders.json` contain customer-submitted data and are listed in `.gitignore`.

### `lib/db.js` (server only)

- `readJson(file)` / `writeJson(file, data)`.
- Atomic writes: write to a temp file, then rename over the target.
- A simple in-memory write lock/queue so concurrent writes can't corrupt a file.
- If a file is missing, create it with a sensible default (`[]` or `{}` as appropriate).
- **Comment in the file, and a README note:** file writes work locally and on a VPS/own server but are **not reliable on serverless hosts like Vercel** (read-only/ephemeral filesystem). Reads are fine anywhere. Only `lib/leads.js` and `lib/orders.js` perform writes, so a future migration to a database touches only those two files.

### Helper modules

`lib/batteries.js`, `lib/brands.js`, `lib/services.js`, `lib/cars.js`, `lib/areas.js`, `lib/compat.js`, `lib/combos.js`, `lib/faqs.js`, `lib/site.js`, `lib/leads.js`, `lib/orders.js`.

- Server Components call these helpers directly and pass plain data down as props.
- Client Components never touch `fs`. Writes go through API routes only.
- `/api/leads` and `/api/orders` validate input server-side and include a honeypot field.
- `/api/orders` **recomputes prices on the server** from `batteries.json` — client-submitted prices are never trusted.

### Cart and wishlist

Stay in the browser via `localStorage` (read in `useEffect`, not in JSON files, not sent to the server until an order is placed).

### `scripts/`

- **`validate-data.js`** — checks:
  - all slugs unique within each file,
  - every battery id referenced in `compat.json` exists in `batteries.json`,
  - every `nearbyAreas` slug referenced in `areas.json` exists in `areas.json`,
  - required fields present on every record,
  - no duplicate keys in `combo-notes.json`.
  - Exits non-zero on any error, printing a readable list of problems.
  - Wired up as `npm run validate`.
- **`import-csv.js`** — converts `cars.csv` and `areas.csv` into `cars.json` and `areas.json`, slugifying names and running the same validation as above.
  - Wired up as `npm run import:cars` and `npm run import:areas`.

---

## B. Data schemas

Full field-level detail lives in `docs/DATA-SCHEMA.md`. Summary:

- **`cars.json`** record: `slug, name, make, model, yearFrom, yearTo, batteryType (DIN/JIS/AGM/EFB/Standard), groupSize, startStop (boolean), commonIssues (string[]), popularity (1-10)`.
- **`areas.json`** record: `slug, name, city, landmarks (string[], min 2), parkingNote, responseMinutes, nearbyAreas (slug[]), demand (1-10)`.
- **`batteries.json`** record: `id, slug, brand, name, type (DIN/JIS/AGM/Standard), capacityAh, voltage, cca, price, compareAtPrice, rating, reviewCount, warrantyMonths, stock, badge, images[], description`.

Technical fitment fields on cars (`groupSize`, `batteryType`, `startStop`) must ultimately come from real fitment data supplied by the business owner. Until that data is supplied, every sample record marks these fields with a `"SAMPLE — verify"` flag so nothing fabricated is presented as real automotive fitment data.

---

## C. Site frame and landing page

- **Header**: logo, nav tabs (Service & Repair, Battery, Tyres, Insurance), active tab rendered as a filled primary-color pill, search icon, Login, cart icon with a count badge. Sticky, white, subtle shadow.
- **Floating buttons**: call (`tel:`) and WhatsApp (`wa.me`) buttons, each with a soft pulsing halo (CSS animation), fixed bottom-right on desktop. On mobile, replaced by a sticky two-button bottom bar (Call / WhatsApp).
- **Hero** on `/car-battery-replacement`: soft light-blue gradient background; H1 in two lines, second line in primary color; two trust badges (30-minute fitting, warranty); white card with a 5-row checklist and two buttons — WhatsApp (filled) and Call (outlined).
- **Featured batteries carousel**: 6–8 `BatteryCard`s, horizontal, `scroll-smooth`, hidden scrollbar; left arrow appears only after scrolling starts, right arrow hides at the end of scroll; "Shop Batteries >" link top-right, "Shop All Batteries >" button centered below.
- **Later landing sections** (own phase, see PHASES.md Phase 10): why us, services, warning signs, diagnosis, jump-start vs replace, how it works, battery types table, climate/heat guide, brands, testimonials (clearly marked placeholder), areas list, FAQ, quote form, footer.

---

## D. Battery module

### `BatteryCard`

- Fixed-aspect image area, `object-cover`, placeholder image if none provided, small carousel dots, a faint brand-logo watermark overlay, a wishlist heart button (top-right), an "Add to Cart" tab at the bottom-right of the image.
- Below the image: uppercase product name (turns primary color on hover), price (small currency label + large number), two generic "pay in installments" badges (original simple icons — no third-party payment-provider logos), a small primary-color badge line sourced from the product's `badge` field, and "Order now & get it by [time]".
- Delivery time = current time + 1 hour, computed client-side in `useEffect`; render nothing for that line until mounted, to avoid hydration mismatch.
- The whole card links to `/batteries/[slug]`. The Add to Cart button and the wishlist heart must stop propagation / prevent the card's navigation.
- Fixed min-height on the text block so grid rows stay visually even regardless of name length.

### `/batteries` listing page

- Breadcrumb: Home > Batteries. H1 "All Batteries" with a live "N products found" count. Sort dropdown top-right.
- Full-width search box (search icon, primary-color focus ring). Matches brand, name, capacity (accepts both `"45ah"` and `"45 ah"`), and type. Case-insensitive, instant, client-side.
- Filter sidebar ("Filters" card): price range (min/max number inputs + slider, defaulting to the min/max price present in the data), Brand / Battery Type / Capacity checkbox lists each showing a live count per option (brand list scrolls inside its own max-height box), and a "Clear all filters" button. Multiple selections allowed per facet.
- Sort options: Price Low→High (default), Price High→Low, Top Rated, Name A→Z. Sorting must copy the array first and remain stable.
- Search + filters + sort are combined via `useMemo`; the displayed count always equals the filtered result length.
- Grid: 5 columns on `xl`, 4 on `lg`, 3 on `md`, 2 on `sm` and mobile.
- Empty state: "No batteries match your search" + a Clear Filters button.
- Mobile: sidebar hidden behind a "Filters" button that opens a slide-over drawer.
- Search, filters and sort sync to URL query params (`?brand=bosch&type=AGM&sort=price-desc&q=45`) via `useSearchParams`, so results are shareable/bookmarkable.

### `/batteries/[slug]` detail page

- Breadcrumb, image gallery, title, rating, three info cells (service time, installation, warranty), price, an installment estimate (`price / 4`), a quantity stepper, "Add to Cart" and "Buy now and Book Installation" actions.
- `generateStaticParams` for all battery slugs, `generateMetadata` for per-product title/description, canonical URL, and `Product` JSON-LD.

### Brand pages `/brand/[brand]`

List the brand's products with the same card component, brand description and warranty info from `brands.json`.

---

## E. Programmatic SEO pages (service × area × car)

Permutations are **never stored** — only the underlying lists (`services`, `areas`, `cars`, `compat`) are stored; combination pages are generated in code at request/build time.

### URL structure

- `/car-battery-replacement` — service hub.
- `/car-battery-replacement/[area]` — ~300 pages (area pages).
- `/car-battery-replacement/car/[car]` — ~100 pages (car pages). The literal segment `car` disambiguates this route from an area slug.
- `/car-battery-replacement/[area]/[car]` — up to ~30,000 possible combination pages; only quality-passing ones are indexed.

**Route conflict rule:** `car` is reserved as a literal path segment. No entry in `areas.json` may use the slug `car`; `validate-data.js` enforces this.

### Indexing tiers

- **Tier 1** (service × area) and **Tier 2** (service × car): always indexed — content is built from real per-area and per-car data, so every page is unique.
- **Tier 3** (area × car): indexable only if `lib/combos.js`'s `isIndexable(car, area)` returns true. See `docs/SEO-RULES.md` for the exact gate and all uniqueness/rendering rules.

### Rendering strategy

- `generateStaticParams` pre-renders the top 1,000 Tier 3 combinations, ranked by `area.demand * car.popularity`.
- `dynamicParams = true` for the long tail (rendered on demand).
- `revalidate = 86400` (24h) for combination pages.
- `generateMetadata` on every page produces a unique title, description, and canonical URL.

### Sitemap

- `app/sitemap.js` using `generateSitemaps()`, capped at 50,000 URLs per sitemap file, including only indexable URLs.
- `app/robots.js` references the sitemap and disallows crawling of any `noindex` route pattern that would otherwise be reachable (e.g. `/admin`).

Full uniqueness rules, the quality gate, and sitemap mechanics are in `docs/SEO-RULES.md` — do not duplicate changes here without updating that file too.

---

## F. Quote form and leads

- `ContactForm` (name, phone, location, optional car) is a client component that POSTs to `/api/leads`.
- Client-side and server-side validation; honeypot field; loading / success / error UI states; submit button disabled while submitting.
- On combination pages, the form prefills area and car as hidden fields so the lead record captures intent context.
- `/api/orders` works the same way for "Buy now" / checkout requests, except it recomputes totals server-side from `batteries.json`.

---

## G. Engineering rules

- Server Components by default. `"use client"` only where interactivity requires it: header cart badge, floating buttons, carousel, `BatteryGrid` + filters, forms (`ContactForm`, order form), cart and wishlist contexts/consumers.
- Use `next/image` everywhere images are rendered.
- Exactly one `<h1>` per page.
- Mobile-first Tailwind; accessible labels on all buttons and inputs (icon-only buttons get `aria-label`).
- Clean code, commented only where logic is non-obvious (see root `CLAUDE.md` for the project's comment policy).
- Do not add features, pages, or abstractions beyond what is written in this spec without checking in first.
