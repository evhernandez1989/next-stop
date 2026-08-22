// Shared helpers for Next Stop.
// Live restaurant data now comes from the /api/restaurants endpoint — this
// file no longer ships a static list. DATA stays exported (empty) only as a
// harmless fallback for a couple of call sites.

export const DATA = [];

// Editable price tiers: users set their own dollar boundaries; each restaurant
// is bucketed by its estimated per-person cost.
export const DEFAULT_TIERS = [
  { id: "budget", label: "Budget", min: 8, max: 13 },
  { id: "mid", label: "Mid-range", min: 14, max: 24 },
  { id: "splurge", label: "Splurge", min: 25, max: 9999 },
];

export function fmtTier(t) {
  return t.max >= 9999 ? `$${t.min}+` : `$${t.min}\u2013${t.max}`;
}

// Fisher–Yates shuffle, then take the first n.
export function pickN(list, n) {
  const a = [...(list || [])];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// Fixed cuisine categories users can select. Selecting one drives a fresh
// Google search (see the endpoint), so the list must be stable, not derived
// from whatever happened to load.
export const CUISINE_OPTIONS = [
  "Mexican", "Italian", "Pizza", "Chinese", "Japanese", "Thai & SE Asian",
  "Vietnamese", "Korean", "Indian", "Mediterranean", "American", "BBQ",
  "Fast Food", "Seafood", "Steakhouse", "Breakfast", "Sandwiches",
  "Cafe & Brunch", "Bakery", "Dessert", "Brewpub",
];
