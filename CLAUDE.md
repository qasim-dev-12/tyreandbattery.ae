# CLAUDE.md

Read `docs/SPEC.md` and `docs/PHASES.md` before working. `docs/DATA-SCHEMA.md`, `docs/SEO-RULES.md`, and `docs/PERMUTATION.md` are referenced from those two — read them when touching data files or the programmatic SEO routes.

## Project

tyreandbattery (real business name — set in `data/site.json`), mobile car battery replacement, Dubai, UAE (placeholder), currency AED (placeholder). Brand colors: primary `#2563eb`, dark `#0f172a`.

## Stack

Next.js (latest, App Router), JavaScript only (no TypeScript), Tailwind CSS, lucide-react. Data lives in flat JSON files under `/data` — there is no database. See `docs/SPEC.md` §A for why and how.

## Rules

- No component or page imports a JSON file directly — always go through `/lib`.
- Client components never touch the filesystem; writes happen only through `/api` routes (`lib/leads.js`, `lib/orders.js`).
- Server Components by default; `"use client"` only where interactivity requires it.
- Everything shipped — name, logo, copy, images — must be original or a clearly marked placeholder. Never copy content/logos/images from other sites.
- One `<h1>` per page. Mobile-first Tailwind. Accessible labels on every button/input.
- Don't add features, pages, or abstractions beyond what `docs/SPEC.md` describes without checking in first.
- Work phase by phase per `docs/PHASES.md`. Stop after each phase for review — do not chain into the next phase unprompted.

## Folder map

```
app/            routes (App Router) — includes the programmatic SEO routes under app/car-battery-replacement/
components/     UI components (layout, sections, battery, etc.)
context/        CartContext, WishlistContext (localStorage-backed)
lib/            all data access — the only code allowed to read /data
data/           JSON "database"; leads.json and orders.json are gitignored
scripts/        validate-data.js, import-csv.js
docs/           SPEC.md, PHASES.md, DATA-SCHEMA.md, SEO-RULES.md, PERMUTATION.md
```

## Current status

Phases 1–10 of `docs/PHASES.md` are complete: data layer, site frame, hero/carousel, battery listing, detail + brand pages, leads/orders API, Tier 1/2 programmatic pages (area/car), Tier 3 (area×car combo pages with the indexability gate), sitemap/robots/SEO report, and the remaining landing sections. Phase 11 (scale test — 100 cars / 300 areas, see `docs/PERMUTATION.md`) is in progress.
