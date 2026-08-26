import { useState, useEffect, useCallback, useRef } from "react";

// Handles "where are we" + "what restaurants are near there".
// Filters DRIVE the search: pass the selected cuisines and the distance, and
// the hook re-queries Google whenever they change (not just slices a pool).
export function useRestaurants({ cuisines = [], radiusMi } = {}) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [label, setLabel] = useState("");
  const [needCity, setNeedCity] = useState(false);

  // Current filter values kept in refs so the fetch function stays stable
  // (no effect loops) while always reading the latest values.
  const cuisinesKey = (cuisines || []).join(",");
  const cuisinesRef = useRef(cuisinesKey);
  const radiusRef = useRef(radiusMi);
  cuisinesRef.current = cuisinesKey;
  radiusRef.current = radiusMi;

  // Last place we searched, so a filter change can re-run the same location.
  const lastRef = useRef(null); // { lat, lng, label }

  // Cache results per location+filters so repeat spins / re-filters don't re-hit Google.
  const cacheRef = useRef(new Map());
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  const cacheKey = (lat, lng) =>
    `${(+lat).toFixed(3)},${(+lng).toFixed(3)}|${cuisinesRef.current}|${radiusRef.current || ""}`;

  const buildQS = (base) => {
    const parts = [base];
    if (radiusRef.current) parts.push(`radius=${Math.round(radiusRef.current * 1609)}`);
    if (cuisinesRef.current) parts.push(`cuisines=${encodeURIComponent(cuisinesRef.current)}`);
    return parts.join("&");
  };

  const fetchByCoords = useCallback(async (lat, lng, lbl) => {
    lastRef.current = { lat, lng, label: lbl };
    const ck = cacheKey(lat, lng);
    const hit = cacheRef.current.get(ck);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      setRestaurants(hit.data);
      setLabel(lbl || "Near you");
      setNeedCity(false);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/restaurants?${buildQS(`lat=${lat}&lng=${lng}`)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load restaurants.");
      const list = data.restaurants || [];
      cacheRef.current.set(ck, { data: list, ts: Date.now() });
      setRestaurants(list);
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
      const res = await fetch(`/api/restaurants?${buildQS(`city=${encodeURIComponent(city.trim())}`)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't find that place.");
      setRestaurants(data.restaurants || []);
      setLabel(city.trim());
      setNeedCity(false);
      if (data.origin && typeof data.origin.lat === "number") {
        lastRef.current = { lat: data.origin.lat, lng: data.origin.lng, label: city.trim() };
      }
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
      () => { setNeedCity(true); setLoading(false); },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchByCoords]);

  // Locate once on mount.
  useEffect(() => { useMyLocation(); }, [useMyLocation]);

  // Re-query when the filters (cuisines / distance) change — debounced so
  // rapid chip toggling fires one search instead of one per tap.
  useEffect(() => {
    if (!lastRef.current) return;
    const { lat, lng, label: lbl } = lastRef.current;
    const t = setTimeout(() => fetchByCoords(lat, lng, lbl), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuisinesKey, radiusMi]);

  return { restaurants, loading, error, label, needCity, setCity, useMyLocation, loadCoords: fetchByCoords };
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
