# Service Permutation — Multiple Services, Full pSEO Per Service

Status: **approved, implementing now.** Confirmed: add 4 new battery-related services
and give each the full area/car/battery/brand page system that
`car-battery-replacement` already has (`docs/PERMUTATION.md`,
`docs/BATTERY-PERMUTATION.md`), not just a standalone content page.

## New services

`data/services.json` grows from 1 to 5 entries, all `active: true`:

1. Car Battery Replacement (existing, unchanged)
2. Car Battery Testing & Diagnostic
3. Jump-Start Service
4. Battery Installation (customer-supplied battery)
5. Old Battery Disposal & Recycling

## Architecture decision: literal folders, not a `[service]` dynamic segment

Two ways to make every route service-aware:

- **A — `app/[service]/...`**: one set of route files, service read from the URL segment.
- **B — literal sibling folders** (`app/jump-start-service/...`, etc.), each a thin
  wrapper around shared rendering logic in `/lib`.

Going with **B**. Reasons:

- **A makes every existing top-level route a collision risk forever** — `/batteries`,
  `/brand`, `/admin`, `/api`, `/robots.txt`, `/sitemap` would all need to be checked
  against every future service slug, since `[service]` would sit at the same path depth.
  B leaves those alone; only `data/services.json` slugs need checking against each
  other and against the existing reserved words (`car`, `areas`, `battery`, `brand`).
- **A changes the existing, working `car-battery-replacement` tree's routing mechanics**
  (hardcoded folder → dynamic segment) for zero functional gain — that service's 17,103
  pages already work today. B adds new trees alongside it untouched, zero regression risk
  to what's already live.
- Next.js nested dynamic params (`[service]/[area]/[car]`) require each level's
  `generateStaticParams` to compose with its parent's — solvable, but it's extra
  complexity bought for no benefit when B achieves the same URLs
  (`/jump-start-service/downtown-1/toyota-corolla-2014-2017`) more simply.

To avoid copy-pasting all 11 route files × 5 services, the actual data-fetching + JSX
for each page type is extracted once into shared builder functions
(`lib/pageBuilders/*.js`), parameterized by a `service` record (`{slug, name,
shortDescription}`). Each literal folder's `page.js` becomes a thin wrapper:

```js
// app/jump-start-service/[area]/page.js
import { getServiceBySlug } from "@/lib/services";
import { areaPageMetadata, AreaPage } from "@/lib/pageBuilders/areaPage";

const SERVICE_SLUG = "jump-start-service";

export async function generateStaticParams() { /* same areas list for every service */ }
export async function generateMetadata({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return areaPageMetadata(service, params);
}
export default async function Page({ params }) {
  const service = await getServiceBySlug(SERVICE_SLUG);
  return AreaPage({ service, params });
}
```

`car-battery-replacement`'s own 11 files are migrated to the same thin-wrapper shape
first, as the correctness check that the extraction didn't change anything — rebuilt and
diffed against the current 17,103-page baseline before any new service folder is added.

## Content uniqueness per service

Every `introFor`-style function (currently hardcoded around "battery replacement"
wording) is parameterized by `service.name`/`service.shortDescription` so pages read as
genuinely service-specific, not relabeled duplicates — e.g. an area page under
`jump-start-service` talks about jump-starts and response time, not "we carry compatible
batteries." `pickVariant`'s hash input gets the service slug folded in
(`${service.slug}__${areaSlug}__...`) so the same area/car/battery/brand doesn't
coincidentally render byte-identical copy across two services.

## `combo-notes.json` key scheme (extended again)

Existing scheme (`docs/BATTERY-PERMUTATION.md`) is car-battery-replacement-only by
convention today but not explicitly namespaced by service. Extending it:

- `${serviceSlug}__${areaSlug}__${carSlug}`
- `${serviceSlug}__${areaSlug}__battery__${batterySlug}`
- `${serviceSlug}__${areaSlug}__brand__${brandSlug}`

Existing notes in `data/combo-notes.json` are migrated to prefix
`car-battery-replacement__` so they keep applying only to that service (a hand-written
note about replacing a battery in Downtown 1 isn't automatically true for jump-starting
one there).

## Rendering strategy for the 4 new services (decision)

The existing service's Tier 3 battery/brand combos were fully pre-rendered (15,600 pages,
~6 min build) per an explicit later request. Doing that **again for 4 more services**
would mean 4 × 15,600 = 62,400 additional fully-rendered combo pages on top of car
combos, pushing total build time well past 30 minutes and total pages past 80,000.

For the **4 new services**, reverting to the original capped strategy
(`docs/SEO-RULES.md` "Rendering strategy"): top 1,000 car combos, top 1,000 battery
combos, top 500 brand combos pre-rendered per service; the rest render on first visit via
`dynamicParams = true` and cache for 24h. This still means **every URL exists and is
indexable where it passes the quality gate** — it only changes *when* the HTML is
generated, not whether the page exists. `car-battery-replacement` keeps its current full
pre-render (no change to the already-approved tier).

## Page-count math

| Per service | Tier 1 (area) | Tier 2 (car) | Tier 2 (battery) | Directories | Tier 3 (car×area) pre-rendered | Tier 3 (battery×area) pre-rendered | Tier 3 (brand×area) pre-rendered |
|---|---|---|---|---|---|---|---|
| car-battery-replacement (existing, unchanged) | 300 | 100 | 40 | 5 | 1,000 of 30,000 | 12,000 of 12,000 (full) | 3,600 of 3,600 (full) |
| each of the 4 new services | 300 | 100 | 40 | 5 | 1,000 of 30,000 | 1,000 of 12,000 | 500 of 3,600 |

New pages added: 4 × (300+100+40+5+1,000+1,000+500) = 4 × 2,945 = **11,780** pre-rendered
pages, plus the long tail of every service's uncapped combos rendering on demand.

**New total pre-rendered pages: 17,103 (existing) + 11,780 = 28,883.**

## Reserved words (decision)

`validate-data.js` gains a services.json check: no two service slugs may collide, and no
service slug may equal an existing reserved word used inside the shared route shape
(`car`, `areas`, `battery`, `brand`) — since every service tree repeats that same
internal structure.

## What's not changing

- `/brand/[brand]` (the battery-brand product listing) stays service-agnostic — a brand
  sells the same battery SKUs regardless of which service someone is searching for.
- `/batteries`, `/batteries/[slug]` — unchanged, service-agnostic product catalog.
- `data/areas.json`, `data/cars.json`, `data/batteries.json`, `data/brands.json`,
  `data/compat.json` — unchanged; the same underlying lists are reused by every service's
  page tree, only `data/combo-notes.json` keys and `data/services.json` grow.
