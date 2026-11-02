import Link from "next/link";
import { BatteryCharging, Phone, MessageCircle, MapPin, Globe, Camera } from "lucide-react";
import { getSite } from "@/lib/site";

// Every href here must be a route that actually exists — no Tyres/Insurance
// links since those services aren't built yet (docs/PHASES.md Phase 10).
export default async function Footer() {
  const site = await getSite();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-dark/10 bg-dark text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <BatteryCharging className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-lg font-bold text-white">{site.businessName}</span>
            </div>
            <p className="mt-3 text-sm">{site.tagline}</p>
            <div className="mt-4 flex gap-3">
              {site.social?.facebook && (
                <a
                  href={site.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {site.social?.instagram && (
                <a
                  href={site.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Shop</h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li><Link href="/batteries" className="hover:text-white">All Batteries</Link></li>
              <li><Link href="/car-battery-replacement" className="hover:text-white">Car Battery Replacement</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Contact</h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {site.address}
              </li>
              <li>
                <a href={`tel:${site.phone}`} className="flex items-center gap-2 hover:text-white">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {site.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappPrefilledText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  WhatsApp us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
          © {year} {site.businessName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
