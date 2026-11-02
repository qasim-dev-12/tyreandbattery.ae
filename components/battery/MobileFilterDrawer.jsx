"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import FilterPanel from "./FilterPanel";

export default function MobileFilterDrawer({ open, onClose, resultCount, ...filterProps }) {
  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-dark/40"
      />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-dark/10 px-4 py-3">
          <h2 className="text-base font-bold text-dark">Filters</h2>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-dark/5"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <FilterPanel {...filterProps} />
        </div>

        <div className="border-t border-dark/10 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Show {resultCount} results
          </button>
        </div>
      </div>
    </div>
  );
}
