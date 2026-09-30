// Shared throttle for the Google-backed API routes.
//
// WHAT THIS IS
//   Per-IP and per-instance request limiting held in module scope, plus a
//   cheap referer check. Its job is to stop a casual script from turning your
//   Google Places bill into a problem.
//
// WHAT THIS IS NOT
//   A hard guarantee. Vercel runs many serverless instances and each one keeps
//   its own counters, so a distributed flood spread across cold starts can
//   exceed these numbers. Real global limiting needs shared state — Vercel KV,
//   Upstash, or Vercel's own firewall. This raises the cost of abuse by a lot
//   without adding a service to run; treat the Google quota cap as the actual
//   ceiling and this as the thing that keeps you from reaching it.

const WINDOW_MS = 60_000;

// Requests allowed per IP per window, per instance.
export const LIMITS = {
  restaurants: 15, // each costs up to 6 billed Google calls
  place: 40,       // cheaper, and one screen can open several
};

// Circuit breaker: total requests one instance will serve per window,
// regardless of source. Catches distributed abuse that slips past per-IP.
const MAX_PER_INSTANCE = 300;

const ALLOWED_HOSTS = new Set([
  "www.nextstoprr.com",
  "nextstoprr.com",
  "next-stop-ckq4.vercel.app", // the project's own alias; it serves the full app
  "localhost",
  "127.0.0.1",
]);

const hits = new Map(); // ip -> array of timestamps
let instanceWindowStart = Date.now();
let instanceCount = 0;

// Prefer the headers Vercel sets itself. It also overwrites X-Forwarded-For,
// but relying on that ties the limiter to one host's behaviour: behind any
// proxy that appends instead, the leftmost entry is whatever the caller sent,
// and a fresh fake IP per request would get a fresh bucket every time. If
// X-Forwarded-For is all there is, take the rightmost entry, the one the
// nearest proxy appended.
function clientIp(req) {
  const first = (v) => (Array.isArray(v) ? v[0] : v);
  const set = (v) => typeof v === "string" && v.trim().length > 0;
  const vercel = first(req.headers["x-vercel-forwarded-for"]);
  if (set(vercel)) return vercel.split(",")[0].trim();
  const real = first(req.headers["x-real-ip"]);
  if (set(real)) return real.trim();
  const fwd = req.headers["x-forwarded-for"];
  const chain = Array.isArray(fwd) ? fwd.join(",") : fwd;
  if (set(chain)) return chain.split(",").map((s) => s.trim()).filter(Boolean).pop();
  return "unknown";
}

// Drop stale entries so a long-lived warm instance doesn't grow forever.
function prune(now) {
  for (const [ip, times] of hits) {
    const fresh = times.filter((t) => now - t < WINDOW_MS);
    if (fresh.length) hits.set(ip, fresh);
    else hits.delete(ip);
  }
}

// Blocks a request whose Referer or Origin names a host that isn't ours.
// A missing header is allowed: same-origin GETs often send no Origin, and
// privacy settings strip Referer. Spoofable by design — this only catches
// embedding and lazy scraping, the rate limit does the real work.
function wrongOrigin(req) {
  const raw = req.headers.origin || req.headers.referer;
  if (!raw) return false;
  try {
    return !ALLOWED_HOSTS.has(new URL(raw).hostname);
  } catch {
    return false;
  }
}

/**
 * Returns true if the request was rejected (response already sent).
 * Call at the top of a handler:  if (rateLimited(req, res, "place")) return;
 */
export function rateLimited(req, res, route) {
  const now = Date.now();

  if (wrongOrigin(req)) {
    res.status(403).json({ error: "Forbidden." });
    return true;
  }

  if (now - instanceWindowStart > WINDOW_MS) {
    instanceWindowStart = now;
    instanceCount = 0;
    prune(now);
  }

  if (++instanceCount > MAX_PER_INSTANCE) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Busy right now. Try again in a minute." });
    return true;
  }

  const ip = clientIp(req);
  const max = LIMITS[route] ?? 15;
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= max) {
    hits.set(ip, recent);
    const oldest = recent[0];
    const retry = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    res.setHeader("Retry-After", String(retry));
    res.status(429).json({ error: "Too many requests. Slow down a moment." });
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);
  return false;
}
