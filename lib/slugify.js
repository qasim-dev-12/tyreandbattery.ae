// Pure string utility — no fs access, safe to import from both server and
// client code (e.g. a BatteryCard deriving a brand logo path from a brand name).
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
