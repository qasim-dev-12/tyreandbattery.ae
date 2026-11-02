import { SITE_URL } from "./constants";

export function buildBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function buildServiceJsonLd({ name, areaServed, provider, url }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    areaServed,
    provider: { "@type": "LocalBusiness", name: provider },
    url: `${SITE_URL}${url}`,
  };
}

// Returns null (render nothing) when there are no FAQs, so the JSON-LD
// never claims FAQ content that isn't actually visible on the page.
export function buildFaqJsonLd(faqs) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
