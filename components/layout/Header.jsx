import Link from "next/link";
import { BatteryCharging, Search, User } from "lucide-react";
import { getSite } from "@/lib/site";
import NavTabs from "./NavTabs";

export default async function Header() {
  const site = await getSite();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <BatteryCharging className="h-7 w-7 text-primary" aria-hidden="true" />
            <span className="text-lg font-bold tracking-tight text-dark">
              {site.businessName}
            </span>
          </Link>

          <NavTabs className="hidden md:flex md:items-center md:gap-1" />

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-full text-dark/70 hover:bg-dark/5 hover:text-dark transition-colors"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Login"
              className="hidden sm:flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-dark/70 hover:bg-dark/5 hover:text-dark transition-colors"
            >
              <User className="h-5 w-5" aria-hidden="true" />
              Login
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 md:hidden scrollbar-hide">
          <NavTabs className="flex gap-2" />
        </div>
      </div>
    </header>
  );
}
