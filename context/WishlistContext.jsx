"use client";

import { createContext, useContext, useEffect, useState } from "react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "voltrunner_wishlist";

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, hydrated]);

  function toggle(batteryId) {
    setIds((prev) =>
      prev.includes(batteryId)
        ? prev.filter((id) => id !== batteryId)
        : [...prev, batteryId]
    );
  }

  function isWishlisted(batteryId) {
    return ids.includes(batteryId);
  }

  return (
    <WishlistContext.Provider value={{ ids, toggle, isWishlisted, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
