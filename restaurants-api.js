// Vercel serverless function — runs on the server, so the Google key stays secret.
// The app calls /api/restaurants?lat=..&lng=..  (or ?city=..) and gets back a
// clean list in the same shape the app already uses.

const PRICE_EST = { 1: 10, 2: 19, 3: 30 };

// Map Google's price level enum -> our 1/2/3, then to an estimated per-person cost.
function priceFromLevel(level) {
  switch (level) {
    case "PRICE_LEVEL_INEXPENSIVE": return 1;
    case "PRICE_LEVEL_MODERATE": return 2;
    case "PRICE_LEVEL_EXPENSIVE":
    case "PRICE_LEVEL_VERY_EXPENSIVE": return 3;
    default: return 2; // unknown -> treat as mid
  }
}

function tierRange(price) {
  return price === 1 ? "$8\u2013\u200913" : price === 3 ? "$25+" : "$14\u2013\u200924";
}

// Very rough cuisine guess from Google place types, mapped to our icon categories.
function cuisineFromTypes(types = []) {
  const t = new Set(types);
  if (t.has("steak_house")) return "Steakhouse";
  if (t.has("seafood_restaurant")) return "Seafood";
  if (t.has("pizza_restaurant") || t.has("italian_restaurant")) return "Italian";
  if (t.has("cafe") || t.has("coffee_shop")) return "Cafe & Brunch";
  if (t.has("breakfast_restaurant") || t.has("brunch_restaurant")) return "Breakfast";
  if (t.has("bar") || t.has("pub") || t.has("brewery")) return "Brewpub";
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

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server missing GOOGLE_PLACES_KEY" });
  }

  try {
    let { lat, lng, city, radius } = req.query;
    const radiusMeters = Math.min(50000, Math.max(1000, Number(radius) || 40000));

    // If a city/address was given instead of coordinates, geocode it first.
    if ((!lat || !lng) && city) {
      const geo = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${key}`
      ).then((r) => r.json());
      const loc = geo.results?.[0]?.geometry?.location;
      if (!loc) return res.status(404).json({ error: "Couldn't find that place." });
      lat = loc.lat; lng = loc.lng;
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: "Provide lat/lng or a city." });
    }
    const origin = { lat: Number(lat), lng: Number(lng) };

    // Places API (New) — Nearby Search (POST with a field mask).
    const body = {
      includedTypes: ["restaurant"],
      maxResultCount: 20,
      locationRestriction: {
        circle: { center: { latitude: origin.lat, longitude: origin.lng }, radius: radiusMeters },
      },
      rankPreference: "POPULARITY",
    };
    const fieldMask = [
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

    const resp = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.error?.message || "Places request failed" });
    }

    const restaurants = (data.places || []).map((p) => {
      const price = priceFromLevel(p.priceLevel);
      const loc = p.location || {};
      const r = {
        name: p.displayName?.text || "Unknown",
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
      return r;
    }).sort((a, b) => a.distance - b.distance);

    // Cache at the edge for 5 min so repeated spins don't re-bill Google.
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ origin, restaurants });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected error fetching places." });
  }
}
