import { useState, useEffect } from "react";
import { X, Star, Phone, Navigation, ExternalLink, Clock, UtensilsCrossed, MapPin } from "lucide-react";
import { directionsUrl } from "./useRestaurants";

const C = {
  shell: "#20262E", card: "#2E3742", board: "#1B1F26", flap: "#14171B",
  amber: "#F2B705", amberStar: "#E8A33D", cream: "#F5EFE0", creamDim: "#C7CDD6",
  muted: "#8B93A1", maroon: "#7A2E2E",
  hairline: "rgba(255,255,255,0.10)", fill: "rgba(255,255,255,0.06)",
};

function Stars({ rating }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={13} fill={C.amberStar} color={C.amberStar} />
      <span className="font-mono text-[12px]" style={{ color: C.cream }}>{rating.toFixed(1)}</span>
    </span>
  );
}

export default function PlaceInfo({ place, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHours, setShowHours] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    (async () => {
      try {
        if (!place.id) throw new Error("No details available for this spot.");
        const res = await fetch(`/api/place?id=${encodeURIComponent(place.id)}`);
        const d = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(d.error || "Couldn't load details.");
        setData(d);
      } catch (e) {
        if (!cancelled) setError(e.message || "Couldn't load details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [place.id]);

  const website = data?.website;
  const gmaps = data?.googleMapsUri;
  const phone = data?.phone || place.phone;
  const address = data?.address || place.address;

  const linkBtn = { backgroundColor: C.card, color: C.cream, border: `1px solid ${C.hairline}` };

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: C.shell }}>
      {/* header */}
    
      <div className="flex items-start justify-between px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${C.hairline}` }}>
        <div className="pr-3">
          <h2 className="font-display text-xl font-bold leading-tight" style={{ color: C.cream }}>{place.name}</h2>
          {address && <p className="text-[12px] font-body mt-1" style={{ color: C.muted }}>{address}</p>}
        </div>
        <button onClick={onClose} className="shrink-0 p-1.5 rounded-full" style={{ backgroundColor: C.fill, color: C.creamDim }} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <p className="text-[13px] font-body" style={{ color: C.muted }}>Loading details…</p>
        )}
        {error && !loading && (
          <p className="text-[13px] font-body" style={{ color: "#FF9B9B" }}>{error}</p>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {/* rating + open status */}
            <div className="flex items-center gap-3">
              {data.rating ? (
                <span className="inline-flex items-center gap-1">
                  <Stars rating={data.rating} />
                  {data.ratingCount ? <span className="font-mono text-[11px]" style={{ color: C.muted }}>({data.ratingCount.toLocaleString()})</span> : null}
                </span>
              ) : null}
              {data.openNow != null && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: data.openNow ? "rgba(80,160,90,0.18)" : C.fill, color: data.openNow ? "#8FD69B" : C.muted }}>
                  {data.openNow ? "Open now" : "Closed"}
                </span>
              )}
            </div>

            {/* editorial summary */}
            {data.summary && (
              <p className="text-[13px] font-body leading-relaxed" style={{ color: C.creamDim }}>{data.summary}</p>
            )}

            {/* hours */}
            {data.hours && data.hours.length > 0 && (
              <div>
                <button onClick={() => setShowHours((s) => !s)} className="flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-wide" style={{ color: C.muted }}>
                  <Clock size={13} /> Hours {showHours ? "▲" : "▼"}
                </button>
                {showHours && (
                  <div className="mt-2 space-y-0.5">
                    {data.hours.map((h, i) => (
                      <p key={i} className="text-[12px] font-body" style={{ color: C.creamDim }}>{h}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* reviews */}
            {data.reviews && data.reviews.length > 0 && (
              <div>
                <p className="text-[12px] font-mono uppercase tracking-wide mb-2" style={{ color: C.muted }}>Reviews</p>
                <div className="space-y-3">
                  {data.reviews.map((rv, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.fill }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-display font-medium" style={{ color: C.cream }}>{rv.author}</span>
                        {rv.rating ? <Stars rating={rv.rating} /> : null}
                      </div>
                      {rv.text && <p className="text-[12px] font-body leading-relaxed" style={{ color: C.creamDim }}>{rv.text.length > 280 ? rv.text.slice(0, 280) + "…" : rv.text}</p>}
                      {rv.when && <p className="text-[10px] font-mono mt-1" style={{ color: C.muted }}>{rv.when}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] font-body pt-1" style={{ color: C.muted }}>
              Photos and popular dishes are on the restaurant's Google page — tap "View on Google Maps" below.
            </p>
          </div>
        )}
      </div>

      {/* action buttons */}
      <div className="px-5 py-4 grid grid-cols-2 gap-2" style={{ borderTop: `1px solid ${C.hairline}` }}>
        {website && (
          <a href={website} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-display font-semibold" style={{ backgroundColor: C.maroon, color: C.cream }}>
            <UtensilsCrossed size={14} /> Menu / Site
          </a>
        )}
        {gmaps && (
          <a href={gmaps} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-display font-semibold" style={linkBtn}>
            <ExternalLink size={14} /> Google Maps
          </a>
        )}
        <a href={directionsUrl(place.name, address || "")} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-display font-semibold" style={linkBtn}>
          <Navigation size={14} /> Directions
        </a>
        {phone && (
          <a href={`tel:${phone}`} className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-display font-semibold" style={linkBtn}>
            <Phone size={14} /> Call
          </a>
        )}
      </div>
    </div>
  );
}
