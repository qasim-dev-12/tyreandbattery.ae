# Data Schema

Every file lives in `/data`, is read/written only through `lib/db.js`, and is never imported directly by a component or page. All helpers live in `/lib` (see `docs/SPEC.md` §A).

---

## `data/site.json`

Single object, not an array.

| Field | Type | Notes |
|---|---|---|
| `businessName` | string | |
| `tagline` | string | |
| `phone` | string | E.164-ish, digits only after `+`, used for `tel:` links |
| `phoneDisplay` | string | human-formatted version of `phone` |
| `whatsapp` | string | digits only, no `+`, used for `wa.me/` links |
| `whatsappPrefilledText` | string | URL-encoded at render time, not stored encoded |
| `address` | string | |
| `city` | string | |
| `country` | string | |
| `currency` | string | ISO-ish code, e.g. `AED` |
| `currencySymbol` | string | display symbol/code |
| `social` | object | `{ facebook, instagram, ... }`, each a URL |
| `hero` | object | `{ titleLine1, titleLine2, subtext, trustBadges: [{icon, text}], checklist: string[5] }` |
| `trustBadges` | array | global trust badges `[{icon, text}]`, `icon` is a lucide-react icon name |

**Validation:** `phone` and `whatsapp` non-empty; `hero.checklist` has exactly 5 entries; `currency` non-empty.

---

## `data/batteries.json`

Array of battery records.

| Field | Type | Notes |
|---|---|---|
| `id` | number | stable, unique, used by `compat.json` |
| `slug` | string | unique, URL-safe |
| `brand` | string | must match a `brands.json` `name` |
| `name` | string | |
| `type` | enum | `DIN` \| `JIS` \| `AGM` \| `Standard` |
| `capacityAh` | number | 40–110 range in sample data |
| `voltage` | number | typically `12` |
| `cca` | number | cold cranking amps |
| `price` | number | in `site.json` currency, integer or 2dp |
| `compareAtPrice` | number \| null | strike-through price if discounted |
| `rating` | number | 0–5, 1dp |
| `reviewCount` | number | integer ≥ 0 |
| `warrantyMonths` | number | integer |
| `stock` | number | integer ≥ 0 |
| `badge` | string \| null | e.g. `"Best Seller"` |
| `images` | string[] | paths under `/public`; falls back to placeholder if empty |
| `description` | string | |

**Validation:** `id` and `slug` unique across the file; `type` is one of the enum values; `price > 0`.

**Example**

```json
{
  "id": 7,
  "slug": "brand-c-ironcell-70ah",
  "brand": "Brand C",
  "name": "Brand C IronCell 70Ah",
  "type": "AGM",
  "capacityAh": 70,
  "voltage": 12,
  "cca": 640,
  "price": 420,
  "compareAtPrice": 480,
  "rating": 4.3,
  "reviewCount": 58,
  "warrantyMonths": 24,
  "stock": 12,
  "badge": "Best Seller",
  "images": ["/images/batteries/placeholder.svg"],
  "description": "The Brand C IronCell 70Ah is a dependable AGM car battery ..."
}
```

---

## `data/brands.json`

Array of brand records.

| Field | Type | Notes |
|---|---|---|
| `slug` | string | unique |
| `name` | string | unique, matches `batteries[].brand` |
| `logo` | string | path under `/public`, placeholder SVG in sample data |
| `description` | string | |
| `warrantyMonths` | number | typical/standard warranty offered by the brand |

**Validation:** `slug` and `name` unique; every `batteries[].brand` must resolve to a `brands[].name`.

---

## `data/services.json`

Array of service records. Ships with exactly one entry at launch; structure supports adding more later (tyres, oil change, etc.) without a schema change.

| Field | Type | Notes |
|---|---|---|
| `slug` | string | e.g. `car-battery-replacement`, used as the URL base segment |
| `name` | string | display name |
| `shortDescription` | string | |
| `active` | boolean | only `active: true` services get routes/sitemap entries |

**Validation:** `slug` unique; at least one service has `active: true`.

---

## `data/cars.json`

Array of car records (~100 at full scale; 15 in the sample-data phase).

| Field | Type | Notes |
|---|---|---|
| `slug` | string | unique |
| `name` | string | display name, e.g. `"Toyota Corolla 2015–2019"` |
| `make` | string | |
| `model` | string | |
| `yearFrom` | number | |
| `yearTo` | number | |
| `batteryType` | enum | `DIN` \| `JIS` \| `AGM` \| `EFB` \| `Standard` — **real fitment data required**; sample records are tagged, see below |
| `groupSize` | string | battery group size code — **real fitment data required** |
| `startStop` | boolean | whether the trim uses start-stop — **real fitment data required** |
| `commonIssues` | string[] | short phrases, used to vary generated page content |
| `popularity` | number | 1–10, drives Tier 3 static-generation ranking |
| `dataVerified` | boolean | `false` in all sample data; flips to `true` once the business owner confirms `batteryType`/`groupSize`/`startStop` against real fitment data |

**Validation:** `slug` unique; `yearFrom <= yearTo`; `popularity` in `[1,10]`; `commonIssues` has at least 1 entry; slug is never the literal string `car` (reserved route segment, see `docs/SEO-RULES.md`).

**Sample-data rule:** until `dataVerified` is `true`, any page that displays `batteryType`, `groupSize`, or `startStop` must visibly render a `"SAMPLE — verify"` tag next to that value so unverified data is never presented as authoritative.

**Example**

```json
{
  "slug": "toyota-corolla-2015-2019",
  "name": "Toyota Corolla 2015–2019",
  "make": "Toyota",
  "model": "Corolla",
  "yearFrom": 2015,
  "yearTo": 2019,
  "batteryType": "JIS",
  "groupSize": "55D23L",
  "startStop": false,
  "commonIssues": ["Slow crank in high heat", "Corroded terminals"],
  "popularity": 9,
  "dataVerified": false
}
```

---

## `data/areas.json`

Array of area records (~300 at full scale; 30 in the sample-data phase).

| Field | Type | Notes |
|---|---|---|
| `slug` | string | unique, never the literal string `car` |
| `name` | string | |
| `city` | string | |
| `landmarks` | string[] | minimum 2 entries |
| `parkingNote` | string | short description of typical parking at this location |
| `responseMinutes` | number | typical technician response time |
| `nearbyAreas` | string[] | slugs of other `areas.json` entries |
| `demand` | number | 1–10, drives Tier 3 static-generation ranking |

**Validation:** `slug` unique and not one of the reserved literal route segments `"car"` / `"areas"` (see `docs/RELATION.md`); `landmarks.length >= 2`; every `nearbyAreas` entry resolves to an existing area slug; `demand` in `[1,10]`.

**Example**

```json
{
  "slug": "business-bay",
  "name": "Business Bay",
  "city": "Dubai",
  "landmarks": ["Bay Avenue", "Dubai Canal Boardwalk"],
  "parkingNote": "Mostly basement parking in commercial towers; street parking metered during the day.",
  "responseMinutes": 25,
  "nearbyAreas": ["downtown", "al-quoz"],
  "demand": 8
}
```

---

## `data/compat.json`

Single object mapping car slug → compatible battery ids.

```json
{
  "toyota-corolla-2015-2019": [3, 7, 12],
  "honda-civic-2016-2021": [1, 5]
}
```

**Validation:** every key resolves to a `cars.json` slug; every id in every array resolves to a `batteries.json` id.

---

## `data/combo-notes.json`

Single object, optional hand-written notes for specific area×car combinations. Key format: `"{areaSlug}__{carSlug}"`.

```json
{
  "business-bay__toyota-corolla-2015-2019": "We get frequent AGM battery callouts from Bay Avenue basement parking during summer peak heat."
}
```

**Validation:** no duplicate keys (JSON objects can't have duplicate keys literally, but `validate-data.js` checks the source for accidental duplicate literal keys before parsing); each key's `areaSlug` and `carSlug` halves resolve to real slugs.

---

## `data/faqs.json`

Array of FAQ records.

| Field | Type | Notes |
|---|---|---|
| `question` | string | |
| `answer` | string | |
| `page` | string | which page/context this FAQ applies to, e.g. `"home"`, `"batteries"`, or a service slug |

**Validation:** `question` and `answer` non-empty.

---

## `data/leads.json`

Array, starts as `[]`. Appended to by `POST /api/leads`. **Gitignored.**

| Field | Type | Notes |
|---|---|---|
| `id` | string | generated server-side (e.g. uuid) |
| `name` | string | |
| `phone` | string | |
| `location` | string | |
| `car` | string \| null | optional, prefilled from combo pages |
| `source` | string | e.g. page path the lead was submitted from |
| `createdAt` | string | ISO timestamp, server-generated |

---

## `data/orders.json`

Array, starts as `[]`. Appended to by `POST /api/orders`. **Gitignored.**

| Field | Type | Notes |
|---|---|---|
| `id` | string | generated server-side |
| `items` | array | `[{ batteryId, slug, name, quantity, unitPrice, lineTotal }]` — prices recomputed server-side from `batteries.json`, never trusted from the client |
| `total` | number | server-computed sum of `lineTotal` |
| `name` | string | |
| `phone` | string | |
| `location` | string | |
| `createdAt` | string | ISO timestamp, server-generated |

---

## Cross-file integrity (enforced by `scripts/validate-data.js`)

1. Every `batteries[].brand` resolves to a `brands[].name`.
2. Every `compat.json` key resolves to a `cars[].slug`; every id in its value array resolves to a `batteries[].id`.
3. Every `areas[].nearbyAreas` entry resolves to an existing `areas[].slug`.
4. No `cars[].slug` or `areas[].slug` equals the literal string `car`.
5. No duplicate keys across `combo-notes.json`; both halves of every key resolve to real slugs.
6. Required fields present and correctly typed on every record in every file.
7. Exit code is non-zero if any check fails, with a readable list of every failure (not just the first).
