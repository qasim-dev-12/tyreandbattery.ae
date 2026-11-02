"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Only "Battery" maps to a real route today (docs/SPEC.md §G — only the
// car-battery-replacement service exists). The rest are reserved nav slots
// for future services and are visibly inert until those are built.
const TABS = [
  { label: "Service & Repair", href: null },
  { label: "Battery", href: "/car-battery-replacement" },
  { label: "Tyres", href: null },
  { label: "Insurance", href: null },
];

export default function NavTabs({ className = "" }) {
  const pathname = usePathname();

  return (
    <nav className={className} aria-label="Primary">
      {TABS.map((tab) => {
        const isActive = tab.href && pathname.startsWith(tab.href);
        const pillClasses = isActive
          ? "bg-primary text-white"
          : "text-dark/70 hover:text-dark hover:bg-dark/5";

        if (!tab.href) {
          return (
            <span
              key={tab.label}
              aria-disabled="true"
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-dark/35 cursor-not-allowed`}
              title="Coming soon"
            >
              {tab.label}
            </span>
          );
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${pillClasses}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
