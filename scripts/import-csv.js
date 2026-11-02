#!/usr/bin/env node
// Converts data/imports/cars.csv or data/imports/areas.csv into
// data/cars.json / data/areas.json. Slugifies names and runs the same
// checks as validate-data.js afterwards so a bad import is caught
// immediately instead of silently shipping broken data.
//
// Usage: npm run import:cars   (reads data/imports/cars.csv)
//        npm run import:areas  (reads data/imports/areas.csv)

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { slugify } from "../lib/slugify.js";

const DATA_DIR = path.join(process.cwd(), "data");
const IMPORTS_DIR = path.join(DATA_DIR, "imports");

// Minimal RFC4180-ish CSV parser: handles quoted fields, escaped quotes
// (""), and commas/newlines inside quotes. Good enough for hand-authored
// fitment/area spreadsheets without pulling in a dependency.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function readCsvAsObjects(filePath) {
  const text = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(text);
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = (row[i] ?? "").trim();
    });
    return obj;
  });
}

function splitList(value) {
  return value
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

function importCars() {
  const csvPath = path.join(IMPORTS_DIR, "cars.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`Missing ${csvPath}. Expected columns: name,make,model,yearFrom,yearTo,batteryType,groupSize,startStop,commonIssues,popularity`);
    process.exit(1);
  }
  const rows = readCsvAsObjects(csvPath);
  const cars = rows.map((r) => ({
    slug: slugify(`${r.make}-${r.model}-${r.yearFrom}-${r.yearTo}`),
    name: r.name || `${r.make} ${r.model} ${r.yearFrom}–${r.yearTo}`,
    make: r.make,
    model: r.model,
    yearFrom: Number(r.yearFrom),
    yearTo: Number(r.yearTo),
    batteryType: r.batteryType,
    groupSize: r.groupSize,
    startStop: String(r.startStop).toLowerCase() === "true",
    commonIssues: splitList(r.commonIssues),
    popularity: Number(r.popularity) || 5,
    // CSV-imported fitment data is still unverified until a human confirms
    // it against real fitment references — see docs/DATA-SCHEMA.md.
    dataVerified: false,
  }));
  fs.writeFileSync(path.join(DATA_DIR, "cars.json"), JSON.stringify(cars, null, 2));
  console.log(`Wrote ${cars.length} cars to data/cars.json`);
}

function importAreas() {
  const csvPath = path.join(IMPORTS_DIR, "areas.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`Missing ${csvPath}. Expected columns: name,city,landmarks,parkingNote,responseMinutes,nearbyAreas,demand`);
    process.exit(1);
  }
  const rows = readCsvAsObjects(csvPath);
  const areas = rows.map((r) => ({
    slug: slugify(r.name),
    name: r.name,
    city: r.city,
    landmarks: splitList(r.landmarks),
    parkingNote: r.parkingNote,
    responseMinutes: Number(r.responseMinutes) || 30,
    nearbyAreas: splitList(r.nearbyAreas).map(slugify),
    demand: Number(r.demand) || 5,
  }));
  fs.writeFileSync(path.join(DATA_DIR, "areas.json"), JSON.stringify(areas, null, 2));
  console.log(`Wrote ${areas.length} areas to data/areas.json`);
}

const target = process.argv[2];
if (target === "cars") importCars();
else if (target === "areas") importAreas();
else {
  console.error('Usage: node scripts/import-csv.js <cars|areas>');
  process.exit(1);
}

try {
  execFileSync("node", ["scripts/validate-data.js"], { stdio: "inherit" });
} catch {
  console.error("\nImport finished but the resulting data failed validation — see errors above.");
  process.exit(1);
}
