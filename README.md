# tyreandbattery

Mobile car battery replacement website. Next.js App Router, JavaScript, Tailwind CSS, lucide-react.

See `CLAUDE.md` and `docs/SPEC.md` / `docs/PHASES.md` / `docs/DATA-SCHEMA.md` / `docs/SEO-RULES.md` for the full specification and build plan. This README covers day-to-day commands only.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data layer

There is no database. All content lives in JSON files under `/data`, read and written exclusively through `lib/db.js` and the helpers in `/lib` — no page or component imports a JSON file directly (see `docs/SPEC.md` §A for why).

**Important — file writes and hosting:** `lib/db.js` writes atomically (temp file + rename) and queues concurrent writes per file, which works correctly on a normal server or VPS with a persistent filesystem. It does **not** work reliably on serverless hosts like Vercel, where the filesystem is read-only/ephemeral at request time. Reads work fine anywhere. Only `lib/leads.js` and `lib/orders.js` ever call `writeJson`, so moving to a real database later only requires changing those two files — the rest of the app is unaffected.

`data/leads.json` and `data/orders.json` contain customer-submitted data and are listed in `.gitignore` — they are never committed.

## Scripts

```bash
npm run validate       # checks all of /data against docs/DATA-SCHEMA.md — exits non-zero on error
npm run import:cars    # converts data/imports/cars.csv  -> data/cars.json  (see data/imports/cars.example.csv)
npm run import:areas   # converts data/imports/areas.csv -> data/areas.json (see data/imports/areas.example.csv)
```

`import:cars` / `import:areas` expect `data/imports/cars.csv` / `data/imports/areas.csv` to exist — copy the matching `.example.csv` file in that folder and edit it, since importing overwrites `data/cars.json` / `data/areas.json`. Both importers run `npm run validate` automatically afterward.

## Sample vs. real data

Sample `cars.json` records are placeholder data and are marked `dataVerified: false`. Fields that require real automotive fitment data (`batteryType`, `groupSize`, `startStop`) render a visible "SAMPLE — verify" tag anywhere they're shown until that flag is flipped to `true` with real, confirmed fitment data.
