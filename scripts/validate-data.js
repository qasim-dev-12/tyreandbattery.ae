#!/usr/bin/env node
// Validates every file in /data against docs/DATA-SCHEMA.md and the
// cross-file integrity rules it lists. Run with `npm run validate`.
// Exits non-zero and prints every problem found (not just the first).

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const errors = [];

function fail(message) {
  errors.push(message);
}

function loadJson(file, { required = true } = {}) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    if (required) fail(`${file}: file is missing`);
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(`${file}: invalid JSON — ${err.message}`);
    return null;
  }
}

// Detects accidental duplicate literal keys in a JSON object source, which
// JSON.parse silently resolves by keeping only the last one.
function findDuplicateKeysInSource(file) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  const keyPattern = /"((?:[^"\\]|\\.)*)"\s*:/g;
  const seen = new Map();
  const duplicates = [];
  let match;
  while ((match = keyPattern.exec(raw))) {
    const key = match[1];
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [key, count] of seen) {
    if (count > 1) duplicates.push(key);
  }
  return duplicates;
}

const site = loadJson("site.json");
const batteries = loadJson("batteries.json") ?? [];
const brands = loadJson("brands.json") ?? [];
const services = loadJson("services.json") ?? [];
const cars = loadJson("cars.json") ?? [];
const areas = loadJson("areas.json") ?? [];
const compat = loadJson("compat.json") ?? {};
const comboNotes = loadJson("combo-notes.json") ?? {};
const faqs = loadJson("faqs.json") ?? [];
loadJson("leads.json", { required: false });
loadJson("orders.json", { required: false });

// ---------------------------------------------------------------------------
// site.json
// ---------------------------------------------------------------------------
if (site) {
  if (!site.phone) fail("site.json: phone is required");
  if (!site.whatsapp) fail("site.json: whatsapp is required");
  if (!site.currency) fail("site.json: currency is required");
  if (!site.hero || !Array.isArray(site.hero.checklist) || site.hero.checklist.length !== 5) {
    fail("site.json: hero.checklist must have exactly 5 entries");
  }
}

// ---------------------------------------------------------------------------
// batteries.json
// ---------------------------------------------------------------------------
const BATTERY_TYPES = new Set(["DIN", "JIS", "AGM", "Standard"]);
const batteryIds = new Set();
const batterySlugs = new Set();
for (const [i, b] of batteries.entries()) {
  const label = `batteries.json[${i}]`;
  if (b.id == null) fail(`${label}: missing id`);
  else if (batteryIds.has(b.id)) fail(`${label}: duplicate id ${b.id}`);
  else batteryIds.add(b.id);

  if (!b.slug) fail(`${label}: missing slug`);
  else if (batterySlugs.has(b.slug)) fail(`${label}: duplicate slug "${b.slug}"`);
  else batterySlugs.add(b.slug);

  if (!BATTERY_TYPES.has(b.type)) fail(`${label}: invalid type "${b.type}"`);
  if (!(b.price > 0)) fail(`${label}: price must be > 0`);
}

// ---------------------------------------------------------------------------
// brands.json
// ---------------------------------------------------------------------------
const brandSlugs = new Set();
const brandNames = new Set();
for (const [i, brand] of brands.entries()) {
  const label = `brands.json[${i}]`;
  if (!brand.slug) fail(`${label}: missing slug`);
  else if (brandSlugs.has(brand.slug)) fail(`${label}: duplicate slug "${brand.slug}"`);
  else brandSlugs.add(brand.slug);

  if (!brand.name) fail(`${label}: missing name`);
  else if (brandNames.has(brand.name)) fail(`${label}: duplicate name "${brand.name}"`);
  else brandNames.add(brand.name);
}
for (const [i, b] of batteries.entries()) {
  if (b.brand && !brandNames.has(b.brand)) {
    fail(`batteries.json[${i}]: brand "${b.brand}" does not match any brands.json name`);
  }
}

// ---------------------------------------------------------------------------
// services.json
// ---------------------------------------------------------------------------
const RESERVED_WORDS = new Set(["car", "areas", "battery", "brand"]);
const serviceSlugs = new Set();
let hasActiveService = false;
for (const [i, s] of services.entries()) {
  const label = `services.json[${i}]`;
  if (!s.slug) fail(`${label}: missing slug`);
  else {
    // Every service repeats the same internal route shape
    // (app/<service>/car/, /areas, /battery, /brand) — a service slug
    // colliding with one of those literal segments would break routing for
    // every service, not just itself. See docs/SERVICE-PERMUTATION.md.
    if (RESERVED_WORDS.has(s.slug)) {
      fail(`${label}: slug "${s.slug}" is reserved (collides with an internal route segment) and cannot be used by a service`);
    }
    if (serviceSlugs.has(s.slug)) fail(`${label}: duplicate slug "${s.slug}"`);
    else serviceSlugs.add(s.slug);
  }
  if (s.active) hasActiveService = true;
}
if (services.length && !hasActiveService) {
  fail("services.json: at least one service must have active: true");
}

// ---------------------------------------------------------------------------
// cars.json
// ---------------------------------------------------------------------------
const carSlugs = new Set();
for (const [i, car] of cars.entries()) {
  const label = `cars.json[${i}]`;
  if (!car.slug) fail(`${label}: missing slug`);
  else {
    if (car.slug === "car") fail(`${label}: slug "car" is reserved and cannot be used by a car`);
    if (car.slug === "battery") fail(`${label}: slug "battery" is reserved and cannot be used by a car`);
    if (car.slug === "brand") fail(`${label}: slug "brand" is reserved and cannot be used by a car`);
    if (carSlugs.has(car.slug)) fail(`${label}: duplicate slug "${car.slug}"`);
    else carSlugs.add(car.slug);
  }
  if (typeof car.yearFrom === "number" && typeof car.yearTo === "number" && car.yearFrom > car.yearTo) {
    fail(`${label}: yearFrom (${car.yearFrom}) must be <= yearTo (${car.yearTo})`);
  }
  if (!(car.popularity >= 1 && car.popularity <= 10)) {
    fail(`${label}: popularity must be between 1 and 10`);
  }
  if (!Array.isArray(car.commonIssues) || car.commonIssues.length < 1) {
    fail(`${label}: commonIssues must have at least 1 entry`);
  }
}

// ---------------------------------------------------------------------------
// areas.json
// ---------------------------------------------------------------------------
const areaSlugs = new Set();
for (const [i, area] of areas.entries()) {
  const label = `areas.json[${i}]`;
  if (!area.slug) fail(`${label}: missing slug`);
  else {
    if (area.slug === "car") fail(`${label}: slug "car" is reserved and cannot be used by an area`);
    if (area.slug === "areas") fail(`${label}: slug "areas" is reserved and cannot be used by an area`);
    if (area.slug === "battery") fail(`${label}: slug "battery" is reserved and cannot be used by an area`);
    if (area.slug === "brand") fail(`${label}: slug "brand" is reserved and cannot be used by an area`);
    if (areaSlugs.has(area.slug)) fail(`${label}: duplicate slug "${area.slug}"`);
    else areaSlugs.add(area.slug);
  }
  if (!Array.isArray(area.landmarks) || area.landmarks.length < 2) {
    fail(`${label}: landmarks must have at least 2 entries`);
  }
  if (!area.parkingNote) fail(`${label}: parkingNote is required`);
  if (!(area.demand >= 1 && area.demand <= 10)) {
    fail(`${label}: demand must be between 1 and 10`);
  }
}
for (const [i, area] of areas.entries()) {
  for (const nearbySlug of area.nearbyAreas ?? []) {
    if (!areaSlugs.has(nearbySlug)) {
      fail(`areas.json[${i}] ("${area.slug}"): nearbyAreas references unknown slug "${nearbySlug}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// compat.json
// ---------------------------------------------------------------------------
for (const [carSlug, ids] of Object.entries(compat)) {
  if (!carSlugs.has(carSlug)) {
    fail(`compat.json: key "${carSlug}" does not match any cars.json slug`);
  }
  for (const id of ids) {
    if (!batteryIds.has(id)) {
      fail(`compat.json["${carSlug}"]: battery id ${id} does not exist in batteries.json`);
    }
  }
}

// ---------------------------------------------------------------------------
// combo-notes.json
// ---------------------------------------------------------------------------
const duplicateComboKeys = findDuplicateKeysInSource("combo-notes.json");
for (const key of duplicateComboKeys) {
  fail(`combo-notes.json: duplicate key "${key}"`);
}
for (const key of Object.keys(comboNotes)) {
  const parts = key.split("__");

  // Every key is now service-prefixed (docs/SERVICE-PERMUTATION.md):
  // 4-part keys are battery/brand combo notes:
  //   serviceSlug__areaSlug__battery__batterySlug
  //   serviceSlug__areaSlug__brand__brandSlug
  // 3-part keys are car combo notes: serviceSlug__areaSlug__carSlug
  if (parts.length === 4) {
    const [serviceSlug, areaSlug, kind, targetSlug] = parts;
    if (!serviceSlug || !areaSlug || !targetSlug || (kind !== "battery" && kind !== "brand")) {
      fail(`combo-notes.json: key "${key}" is not in "serviceSlug__areaSlug__battery__batterySlug" or "serviceSlug__areaSlug__brand__brandSlug" format`);
      continue;
    }
    if (!serviceSlugs.has(serviceSlug)) {
      fail(`combo-notes.json: key "${key}" references unknown service slug "${serviceSlug}"`);
    }
    if (!areaSlugs.has(areaSlug)) {
      fail(`combo-notes.json: key "${key}" references unknown area slug "${areaSlug}"`);
    }
    if (kind === "battery" && !batterySlugs.has(targetSlug)) {
      fail(`combo-notes.json: key "${key}" references unknown battery slug "${targetSlug}"`);
    }
    if (kind === "brand" && !brandSlugs.has(targetSlug)) {
      fail(`combo-notes.json: key "${key}" references unknown brand slug "${targetSlug}"`);
    }
    continue;
  }

  const [serviceSlug, areaSlug, carSlug] = parts;
  if (!serviceSlug || !areaSlug || !carSlug) {
    fail(`combo-notes.json: key "${key}" is not in "serviceSlug__areaSlug__carSlug" format`);
    continue;
  }
  if (!serviceSlugs.has(serviceSlug)) {
    fail(`combo-notes.json: key "${key}" references unknown service slug "${serviceSlug}"`);
  }
  if (!areaSlugs.has(areaSlug)) {
    fail(`combo-notes.json: key "${key}" references unknown area slug "${areaSlug}"`);
  }
  if (!carSlugs.has(carSlug)) {
    fail(`combo-notes.json: key "${key}" references unknown car slug "${carSlug}"`);
  }
}

// ---------------------------------------------------------------------------
// faqs.json
// ---------------------------------------------------------------------------
for (const [i, faq] of faqs.entries()) {
  if (!faq.question) fail(`faqs.json[${i}]: missing question`);
  if (!faq.answer) fail(`faqs.json[${i}]: missing answer`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (errors.length) {
  console.error(`✗ ${errors.length} validation error(s):\n`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
} else {
  console.log(
    `✓ data valid — ${batteries.length} batteries, ${brands.length} brands, ${cars.length} cars, ${areas.length} areas, ${Object.keys(compat).length} compat entries, ${Object.keys(comboNotes).length} combo notes, ${faqs.length} faqs`
  );
}
