import { useState, useEffect, useCallback } from "react";

// Handles "where are we" + "what restaurants are near there":
// tries the device GPS first, falls back to a typed city if location is
// denied/unavailable, and fetches live results from our /api/restaurants
// serverless function (which holds the Google key server-side).
export function useRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [label, setLabel] = useState("");       // e.g. "Near you" or the city typed
  const [needCity, setNeedCity] = useState(false); // true when we should prompt for a city

  const fetchByCoords = useCallback(async (lat, lng, lbl) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/restaurants?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load restaurants.");
      setRestaurants(data.restaurants || []);
      setLabel(lbl || "Near you");
      setNeedCity(false);
    } catch (e) {
      setError(e.message || "Couldn't load restaurants.");
    } finally {
      setLoading(false);
    }
  }, []);

  const setCity = useCallback(async (city) => {
    if (!city || !city.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/restaurants?city=${encodeURIComponent(city.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't find that place.");
      setRestaurants(data.restaurants || []);
      setLabel(city.trim());
      setNeedCity(false);
    } catch (e) {
      setError(e.message || "Couldn't find that place.");
    } finally {
      setLoading(false);
    }
  }, []);

  const useMyLocation = useCallback(() => {
    setError(null); setLoading(true);
    if (!navigator.geolocation) { setNeedCity(true); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude, "Near you"),
      () => { setNeedCity(true); setLoading(false); }, // denied or failed -> ask for a city
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchByCoords]);

  // Try location once on mount.
  useEffect(() => { useMyLocation(); }, [useMyLocation]);

  return { restaurants, loading, error, label, needCity, setCity, useMyLocation };
}

// Directions link that opens the device's native maps app:
// Apple Maps on iPhone/iPad/Mac, Google Maps everywhere else.
export function directionsUrl(name, address) {
  const q = encodeURIComponent(`${name} ${address}`.trim());
  const isApple =
    typeof navigator !== "undefined" &&
    (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) >= 0 && /Macintosh/i.test(navigator.userAgent)));
  return isApple
    ? `https://maps.apple.com/?daddr=${q}`
    : `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}