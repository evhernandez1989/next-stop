// Vercel serverless function — Google key stays server-side.
// The app calls /api/restaurants?lat=..&lng=..  (or ?city=..) and gets a
// clean, deduped list of nearby food spots across many categories.

const PRICE_EST = { 1: 10, 2: 19, 3: 30 };

function priceFromLevel(level) {
  switch (level) {
    case "PRICE_LEVEL_INEXPENSIVE": return 1;
    case "PRICE_LEVEL_MODERATE": return 2;
    case "PRICE_LEVEL_EXPENSIVE":
    case "PRICE_LEVEL_VERY_EXPENSIVE": return 3;
    default: return 2;
  }
}

function tierRange(price) {
  return price === 1 ? "$8\u2013\u200913" : price === 3 ? "$25+" : "$14\u2013\u200924";
}

// Map Google place types -> our display cuisine (drives the app's icons).
function cuisineFromTypes(types = []) {
  const t = new Set(types);
  // Non-restaurants first, so a gas-station food mart isn't mislabeled as food.
  if (t.has("gas_station") || t.has("convenience_store")) return "Convenience";
  // Formats / specific cuisines
  if (t.has("pizza_restaurant")) return "Pizza";
  if (t.has("fast_food_restaurant") || t.has("hamburger_restaurant")) return "Fast Food";
  if (t.has("steak_house")) return "Steakhouse";
  if (t.has("seafood_restaurant")) return "Seafood";
  if (t.has("mexican_restaurant") || t.has("latin_american_restaurant")) return "Mexican";
  if (t.has("chinese_restaurant")) return "Chinese";
  if (t.has("vietnamese_restaurant")) return "Vietnamese";
  if (t.has("korean_restaurant")) return "Korean";
  if (t.has("japanese_restaurant") || t.has("sushi_restaurant") || t.has("ramen_restaurant")) return "Japanese";
  if (t.has("thai_restaurant") || t.has("indonesian_restaurant")) return "Thai & SE Asian";
  if (t.has("indian_restaurant")) return "Indian";
  if (t.has("middle_eastern_restaurant") || t.has("mediterranean_restaurant")) return "Mediterranean";
  if (t.has("barbecue_restaurant")) return "BBQ";
  if (t.has("italian_restaurant")) return "Italian";
  if (t.has("ice_cream_shop") || t.has("dessert_shop") || t.has("dessert_restaurant")) return "Dessert";
  if (t.has("bakery")) return "Bakery";
  if (t.has("coffee_shop") || t.has("cafe")) return "Cafe & Brunch";
  if (t.has("breakfast_restaurant") || t.has("brunch_restaurant")) return "Breakfast";
  if (t.has("bar") || t.has("pub") || t.has("brewery") || t.has("wine_bar")) return "Brewpub";
  if (t.has("sandwich_shop") || t.has("deli")) return "Sandwiches";
  if (t.has("meal_takeaway")) return "Fast Food";
  if (t.has("diner")) return "Diner";
  return "American";
}

function haversineMiles(a, b) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Query several categories so we don't miss cafes, ice cream, bakeries, etc.
// Each call returns up to 20 of that type; ranked by DISTANCE so close-by
// local spots win instead of distant popular chains.
// Closest-first passes — fill the pool with what's genuinely nearby.
const DISTANCE_GROUPS = [
  ["restaurant"],
  ["cafe", "coffee_shop"],
  ["bakery", "ice_cream_shop"],
  ["bar", "pub"],
  ["meal_takeaway", "fast_food_restaurant"],
];

// Popularity passes — surface well-known local favorites that aren't in the
// nearest 20. The first (generic "restaurant") catches notable spots even if
// Google tagged their cuisine oddly.
const POPULAR_GROUPS = [
  ["restaurant"],
  ["mexican_restaurant"],
  ["chinese_restaurant", "vietnamese_restaurant"],
  ["japanese_restaurant", "sushi_restaurant", "ramen_restaurant"],
  ["korean_restaurant", "thai_restaurant", "indonesian_restaurant"],
  ["italian_restaurant", "pizza_restaurant"],
  ["indian_restaurant", "middle_eastern_restaurant", "mediterranean_restaurant"],
  ["american_restaurant", "hamburger_restaurant", "barbecue_restaurant"],
  ["breakfast_restaurant", "brunch_restaurant"],
  ["sandwich_shop", "seafood_restaurant", "steak_house"],
];

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.types",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
].join(",");

async function nearbyByType(key, origin, radiusMeters, includedTypes, rank) {
  const circle = { center: { latitude: origin.lat, longitude: origin.lng }, radius: radiusMeters };
  const body = {
    includedTypes,
    maxResultCount: 20,
    rankPreference: rank || "DISTANCE",
    locationRestriction: circle,
  };
  const resp = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK },
    body: JSON.stringify(body),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return data.places || [];
}

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(500).json({ error: "Server missing GOOGLE_PLACES_KEY" });

  try {
    let { lat, lng, city, radius } = req.query;
    const radiusMeters = Math.min(50000, Math.max(1000, Number(radius) || 40000));

    if ((!lat || !lng) && city) {
      // Resolve the city to coordinates using Places Text Search (same API the
      // key is authorized for) instead of the separate Geocoding API.
      const geoResp = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "places.location,places.formattedAddress",
        },
        body: JSON.stringify({ textQuery: city, maxResultCount: 1 }),
      });
      const geo = await geoResp.json();
      const loc = geo.places && geo.places[0] && geo.places[0].location;
      if (!loc) return res.status(404).json({ error: "Couldn't find that place." });
      lat = loc.latitude; lng = loc.longitude;
    }
    if (!lat || !lng) return res.status(400).json({ error: "Provide lat/lng or a city." });
    const origin = { lat: Number(lat), lng: Number(lng) };

    const settled = await Promise.allSettled([
      ...DISTANCE_GROUPS.map((types) => nearbyByType(key, origin, radiusMeters, types, "DISTANCE")),
      ...POPULAR_GROUPS.map((types) => nearbyByType(key, origin, radiusMeters, types, "POPULARITY")),
    ]);
    const raw = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));

    const seen = new Set();
    const restaurants = [];
    for (const p of raw) {
      const id = p.id || `${p.displayName && p.displayName.text}|${p.formattedAddress}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const price = priceFromLevel(p.priceLevel);
      const loc = p.location || {};
      const r = {
        id: p.id || "",
        name: (p.displayName && p.displayName.text) || "Unknown",
        cuisine: cuisineFromTypes(p.types),
        rating: p.rating || 0,
        ratingCount: p.userRatingCount || 0,
        price,
        priceRange: tierRange(price),
        estCost: PRICE_EST[price],
        address: p.formattedAddress || "",
        phone: p.internationalPhoneNumber || p.nationalPhoneNumber || "",
        lat: loc.latitude,
        lng: loc.longitude,
      };
      r.distance = haversineMiles(origin, { lat: r.lat, lng: r.lng });
      restaurants.push(r);
    }
    restaurants.sort((a, b) => a.distance - b.distance);
    const trimmed = restaurants.slice(0, 90);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ origin, count: trimmed.length, restaurants: trimmed });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected error fetching places." });
  }
}
