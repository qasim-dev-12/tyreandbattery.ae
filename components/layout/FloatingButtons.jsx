"use client";

import { Phone, MessageCircle } from "lucide-react";

export default function FloatingButtons({ site }) {
  const telHref = `tel:${site.phone}`;
  const waHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    site.whatsappPrefilledText
  )}`;

  return (
    <>
      {/* Desktop: floating buttons, bottom-right, each with a pulsing halo */}
      <div className="fixed bottom-6 right-6 z-40 hidden flex-col gap-3 md:flex">
        <a
          href={telHref}
          aria-label={`Call ${site.phoneDisplay}`}
          className="animate-pulse-halo flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105"
        >
          <Phone className="h-6 w-6" aria-hidden="true" />
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="animate-pulse-halo-green flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </a>
      </div>

      {/* Mobile: sticky two-button bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-dark/10 bg-white md:hidden">
        <a
          href={telHref}
          aria-label={`Call ${site.phoneDisplay}`}
          className="flex items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex items-center justify-center gap-2 bg-green-500 py-3 text-sm font-semibold text-white"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </a>
      </div>
    </>
  );
}
