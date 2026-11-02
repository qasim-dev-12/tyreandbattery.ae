// Deterministic slug -> variant index, so a given page always renders the
// same copy (stable across rebuilds/requests) while different pages get
// structurally different sentence templates, not just synonym swaps.
export function pickVariant(slug, count) {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return hash % count;
}
