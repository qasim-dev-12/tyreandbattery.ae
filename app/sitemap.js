import { getAllSitemapEntries, shardCountFor, MAX_URLS_PER_SITEMAP } from "@/lib/sitemapEntries";

export async function generateSitemaps() {
  const entries = await getAllSitemapEntries();
  const shardCount = shardCountFor(entries.length);
  return Array.from({ length: shardCount }, (_, id) => ({ id }));
}

export default async function sitemap({ id }) {
  // In this Next.js version the `id` prop is itself async, like `params` —
  // it must be awaited, or `id * N` silently evaluates to NaN.
  const resolvedId = Number(await id);
  const entries = await getAllSitemapEntries();
  const start = resolvedId * MAX_URLS_PER_SITEMAP;
  return entries.slice(start, start + MAX_URLS_PER_SITEMAP);
}
