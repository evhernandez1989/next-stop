// A stable id for this device/browser, so a person is one player and one vote.
// Persisted in localStorage; falls back to an in-memory id if storage is blocked.
let cached = null;

export function getDeviceId() {
  if (cached) return cached;
  try {
    let id = localStorage.getItem("nextstop_device");
    if (!id) {
      id = (crypto?.randomUUID?.() || "dev-" + Math.random().toString(36).slice(2));
      localStorage.setItem("nextstop_device", id);
    }
    cached = id;
    return id;
  } catch {
    cached = "anon-" + Math.random().toString(36).slice(2);
    return cached;
  }
}
