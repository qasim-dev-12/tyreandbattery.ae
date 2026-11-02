import { getAllSitemapEntries, shardCountFor } from "@/lib/sitemapEntries";
import { SITE_URL } from "@/lib/constants";

export default async function robots() {
  const entries = await getAllSitemapEntries();
  const shardCount = shardCountFor(entries.length);

  // generateSitemaps() in app/sitemap.js shards output under /sitemap/[id].xml
  // rather than a single /sitemap.xml — list every shard so this stays
  // correct even if the site grows past one shard (see Phase 11 scale test).
  const sitemaps = Array.from({ length: shardCount }, (_, id) => `${SITE_URL}/sitemap/${id}.xml`);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    sitemap: sitemaps,
  };
}
