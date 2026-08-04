// Snapshot data near Ingalls, IN. Replace loadRestaurants() with a live
// Google Places call (via a serverless function that holds your API key)
// when you're ready — the rest of the app only depends on the shape below.

const USER = { lat: 39.94631853967538, lng: -85.81967778748043 };

const RAW = [
  { name: "The Grill-A", cuisine: "American", rating: 4.7, ratingCount: 306, price: 2, address: "4 W Main St, Markleville, IN", phone: "+17655335299", lat: 39.9774008, lng: -85.6147165 },
  { name: "Taylor's Bar & Table", cuisine: "American", rating: 4.5, ratingCount: 858, price: 2, address: "8015 S Indiana 13 Ste 3, Pendleton, IN", phone: "+13177477820", lat: 39.98736, lng: -85.843986 },
  { name: "Du Lit", cuisine: "Eclectic", rating: 4.8, ratingCount: 274, price: 2, address: "101 W Broadway St, Fortville, IN", phone: "+13175059194", lat: 39.9316623, lng: -85.8479369 },
  { name: "Bourbon on the Falls", cuisine: "American", rating: 4.4, ratingCount: 114, price: 2, address: "250 Reformatory Rd, Pendleton, IN", phone: "+17652219080", lat: 39.9899668, lng: -85.7554428 },
  { name: "Salt at Geist", cuisine: "Seafood", rating: 4.8, ratingCount: 981, price: 3, address: "10158 Brooks School Rd, Fishers, IN", phone: "+13173957561", lat: 39.9356666, lng: -85.9480053 },
  { name: "FoxGardin Kitchen & Ale", cuisine: "American", rating: 4.7, ratingCount: 1445, price: 2, address: "215 S Main St, Fortville, IN", phone: "+13174854085", lat: 39.9328977, lng: -85.8484587 },
  { name: "The Crossings Restaurant", cuisine: "Breakfast", rating: 4.7, ratingCount: 325, price: 2, address: "8424 S State Rd 67, Pendleton, IN", phone: "+17652211200", lat: 39.9826278, lng: -85.7526852 },
  { name: "Invited To The Table", cuisine: "Cafe & Brunch", rating: 4.8, ratingCount: 137, price: 2, address: "118 N Pendleton Ave, Pendleton, IN", phone: "+17652219470", lat: 40.0032371, lng: -85.7452918 },
  { name: "Taxman Fortville", cuisine: "Brewpub", rating: 4.6, ratingCount: 1908, price: 2, address: "29 S Main St, Fortville, IN", phone: "+13175593696", lat: 39.9335792, lng: -85.849132 },
  { name: "Aspen Creek Grill", cuisine: "Steakhouse", rating: 4.7, ratingCount: 5989, price: 2, address: "13489 Tegler Dr, Noblesville, IN", phone: "+13175593300", lat: 39.9933662, lng: -85.9250644 },
  { name: "Wolfies Grill", cuisine: "American", rating: 4.5, ratingCount: 322, price: 2, address: "710 W State St, Pendleton, IN", phone: "+17652219405", lat: 40.0047786, lng: -85.7670953 },
  { name: "The Stable", cuisine: "Brewery & Grill", rating: 4.3, ratingCount: 146, price: 2, address: "105 E State St, Pendleton, IN", phone: "+17652219301", lat: 40.0025982, lng: -85.7453432 },
  { name: "INItaly Pizzeria & Bar", cuisine: "Italian", rating: 4.4, ratingCount: 135, price: 2, address: "107 E State St, Pendleton, IN", phone: "+17652211049", lat: 40.0026579, lng: -85.7452537 },
  { name: "Michaels Bistro & Wine Bar", cuisine: "American", rating: 5.0, ratingCount: 49, price: 3, address: "104 W State St, Pendleton, IN", phone: "+17652219262", lat: 40.0025741, lng: -85.7460183 },
  { name: "1925 PubHouse Grandview", cuisine: "American", rating: 4.5, ratingCount: 490, price: 2, address: "1905 Northshore Exd, Anderson, IN", phone: "+17652745016", lat: 40.1142005, lng: -85.7040557 },
  { name: "The Lemon Drop", cuisine: "Diner", rating: 4.7, ratingCount: 1485, price: 1, address: "1701 Mounds Rd, Anderson, IN", phone: "+17656449055", lat: 40.0943272, lng: -85.6593915 },
  { name: "Montana Mike's Steakhouse", cuisine: "Steakhouse", rating: 4.2, ratingCount: 2732, price: 2, address: "6370 S Scatterfield Rd, Anderson, IN", phone: "+17656498000", lat: 40.0517098, lng: -85.6521473 },
  { name: "Creatures of Habit Brewing Co", cuisine: "Brewpub", rating: 4.7, ratingCount: 221, price: 1, address: "1031 Meridian St, Anderson, IN", phone: "+17654000116", lat: 40.1053758, lng: -85.6793333 },
  { name: "Tony's Family Diner", cuisine: "Diner", rating: 4.3, ratingCount: 178, price: 1, address: "2460 E Co Rd 67, Chesterfield, IN", phone: "+17654005310", lat: 40.0833579, lng: -85.6324546 },
  { name: "Carter's Kitchen", cuisine: "Breakfast", rating: 4.5, ratingCount: 104, price: 1, address: "333 Jackson St, Anderson, IN", phone: "+17656354517", lat: 40.1120382, lng: -85.6807818 },
  { name: "Texas Roadhouse", cuisine: "Steakhouse", rating: 4.2, ratingCount: 3502, price: 2, address: "1925 E 60th St, Anderson, IN", phone: "+17656492637", lat: 40.0544703, lng: -85.6544562 },
];

export const PRICE_TIERS = [
  { id: "budget", label: "Budget", range: "$8\u2013\u200913", match: (r) => r.price === 1 },
  { id: "mid", label: "Mid-range", range: "$14\u2013\u200924", match: (r) => r.price === 2 },
  { id: "splurge", label: "Splurge", range: "$25+", match: (r) => r.price === 3 },
];

function haversineMiles(a, b) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export const DATA = RAW.map((r) => {
  const tier = PRICE_TIERS.find((t) => t.match(r));
  return { ...r, distance: haversineMiles(USER, r), priceRange: tier.range, priceTier: tier.id };
}).sort((a, b) => a.distance - b.distance);

// Placeholder for the future live source. Kept async so swapping in a fetch
// later doesn't change call sites.
export async function loadRestaurants() {
  return DATA;
}

// Pick n distinct random restaurants for a spin.
export function pickN(list, n) {
  const picks = [];
  const seen = new Set();
  let guard = 0;
  while (picks.length < Math.min(n, list.length) && guard < 100) {
    const c = list[Math.floor(Math.random() * list.length)];
    if (!seen.has(c.name)) { seen.add(c.name); picks.push(c); }
    guard++;
  }
  return picks;
}
