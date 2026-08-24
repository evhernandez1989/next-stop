import { useState, useMemo, useRef } from "react";
import { useRestaurants, directionsUrl } from "./useRestaurants";
import { CUISINE_OPTIONS } from "./restaurants";
import TipBar from "./TipBar";
import PlaceInfo from "./PlaceInfo";
import {
  Info,
  MapPin, Phone, Navigation, RotateCw, Star, X, ChevronDown,
  Beef, Beer, Coffee, Fish, Pizza, Store, Leaf, UtensilsCrossed, Sparkles,
  Users, ThumbsUp, SkipForward, Trophy, EyeOff, Undo2, Home, ArrowLeft,
} from "lucide-react";

const USER = { lat: 39.94631853967538, lng: -85.81967778748043 };

const RESTAURANTS = [
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

// Central palette — every color is applied via inline styles because this render
// environment does not reliably compile Tailwind arbitrary color utilities.
const C = {
  page: "#0B1020",
  shell: "#12224A",
  shellBorder: "#05070D",
  card: "#173063",
  board: "#0E1B3D",
  flap: "#0A1330",
  amber: "#E23636",
  amberStar: "#F0C808",
  cream: "#F4F7FF",
  creamDim: "#B9CBF0",
  muted: "#7C93C4",
  maroon: "#E23636",
  maroonDeep: "#7A1515",
  hairline: "rgba(90,150,255,0.20)",
  hairlineSoft: "rgba(90,150,255,0.10)",
  fill: "rgba(90,150,255,0.10)",
};

const PRICE_TIERS = [
  { id: "budget", label: "Budget", range: "$8\u2013\u200913", match: (r) => r.price === 1 },
  { id: "mid", label: "Mid-range", range: "$14\u2013\u200924", match: (r) => r.price === 2 },
  { id: "splurge", label: "Splurge", range: "$25+", match: (r) => r.price === 3 },
];

// Editable price tiers: users can set their own dollar boundaries. Each
// restaurant gets an estimated per-person cost from its price level, and is
// bucketed by whichever tier range contains that estimate.
const DEFAULT_TIERS = [
  { id: "budget", label: "Budget", min: 8, max: 13 },
  { id: "mid", label: "Mid-range", min: 14, max: 24 },
  { id: "splurge", label: "Splurge", min: 25, max: 9999 },
];
const PRICE_EST = { 1: 10, 2: 19, 3: 30 };
function fmtTier(t) {
  return t.max >= 9999 ? `$${t.min}+` : `$${t.min}\u2013${t.max}`;
}

const CUISINE_ICONS = {
  American: UtensilsCrossed, Eclectic: Sparkles, Seafood: Fish,
  Breakfast: Coffee, "Cafe & Brunch": Coffee, Brewpub: Beer,
  Steakhouse: Beef, Diner: UtensilsCrossed, Italian: UtensilsCrossed,
  Pizza: Pizza, "Fast Food": Beef, Burgers: Beef, Convenience: Store, Vegan: Leaf, Vegetarian: Leaf, Coffee: Coffee,
  "Brewery & Grill": Beer,
};

function haversineMiles(a, b) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

const DATA = RESTAURANTS.map((r) => {
  const tier = PRICE_TIERS.find((t) => t.match(r));
  return { ...r, distance: haversineMiles(USER, r), priceRange: tier.range, priceTier: tier.id, estCost: PRICE_EST[r.price] };
}).sort((a, b) => a.distance - b.distance);

const CUISINES = [...new Set(DATA.map((r) => r.cuisine))].sort();

const PERMA_KEY = "nextstop_hidden";
function loadPerma() {
  try {
    const raw = localStorage.getItem(PERMA_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}
function savePerma(set) {
  try {
    localStorage.setItem(PERMA_KEY, JSON.stringify([...set]));
  } catch {
    /* no-op: storage unavailable, stays in-memory for this load */
  }
}

function filterPool(list, { maxDistance, cuisineFilter, priceFilter, sessionBlock, permaBlock, tiers }) {
  return (list || []).filter((r) => {
    if (r.distance > maxDistance) return false;
    // cuisine is handled server-side (re-queries Google); no client cuisine filter
    if (priceFilter.size > 0) {
      const inRange = (tiers || DEFAULT_TIERS).some(
        (t) => priceFilter.has(t.id) && r.estCost >= t.min && r.estCost <= t.max
      );
      if (!inRange) return false;
    }
    if (sessionBlock.has(r.name)) return false;
    if (permaBlock.has(r.name)) return false;
    return true;
  });
}

function CuisineIcon({ cuisine, size = 12, className = "", style }) {
  const Icon = CUISINE_ICONS[cuisine] || UtensilsCrossed;
  return <Icon size={size} className={className} style={style} />;
}

function Flap({ char }) {
  return (
    <span
      className="inline-flex items-center justify-center w-[1.05em] h-[1.3em] mx-[1px] font-mono font-bold rounded-[2px] relative overflow-hidden"
      style={{
        backgroundColor: C.flap,
        color: C.amber,
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {char}
    </span>
  );
}

function SpinningTicket({ card, tick }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg relative" style={{ backgroundColor: C.card, border: `1px solid ${C.hairline}` }}>
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "repeating-linear-gradient(90deg,#E23636 0 8px,transparent 8px 16px)" }} />
      <div className="p-4 pt-5" style={{ perspective: "700px" }}>
        <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: C.amber }}>Drawing your ticket…</p>
        <div key={tick} style={{ animation: "cardflip 90ms ease-out" }} className="flex items-center gap-2">
          <CuisineIcon cuisine={card?.cuisine || "American"} size={18} className="shrink-0" style={{ color: C.amber }} />
          <h2 className="font-display text-xl font-bold leading-tight truncate" style={{ color: C.cream, filter: "blur(1.5px)", opacity: 0.8 }}>
            {card?.name || "\u2026"}
          </h2>
        </div>
        <div className="h-[62px]" />
      </div>
    </div>
  );
}

function IdleTicket() {
  return (
    <div className="rounded-xl overflow-hidden relative" style={{ backgroundColor: C.board, border: `1px dashed ${C.hairline}` }}>
      <div className="px-4 py-8 text-center">
        <p className="font-mono text-[11px] tracking-widest uppercase" style={{ color: C.muted }}>Ready when you are</p>
        <p className="font-display text-lg font-bold mt-1" style={{ color: C.creamDim }}>Tap spin to draw a spot</p>
      </div>
    </div>
  );
}

function Board({ text }) {
  const padded = text.toUpperCase().padEnd(22, " ").slice(0, 22);
  return (
    <div
      className="flex flex-wrap justify-center gap-y-1 px-2 py-4 rounded-lg"
      style={{ backgroundColor: C.board, border: "1px solid rgba(0,0,0,0.4)" }}
    >
      {padded.split("").map((c, i) => (
        <Flap key={i} char={c === " " ? "\u00A0" : c} />
      ))}
    </div>
  );
}

function VoteCard({ r, votes, onVote }) {
  return (
    <div className="rounded-lg p-3 flex items-center justify-between gap-2"
      style={{ backgroundColor: C.card, border: `1px solid ${C.hairline}` }}>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <CuisineIcon cuisine={r.cuisine} className="shrink-0" style={{ color: C.amber }} />
          <p className="font-display font-semibold text-[13px] truncate" style={{ color: C.cream }}>{r.name}</p>
        </div>
        <p className="text-[10px] font-mono mt-0.5" style={{ color: C.creamDim }}>
          {r.priceRange} &middot; {r.distance.toFixed(1)} mi
        </p>
      </div>
      <button
        onClick={onVote}
        className="flex items-center gap-1 text-[11px] font-display font-semibold px-2.5 py-1.5 rounded-md shrink-0 active:scale-95 transition-transform"
        style={{ backgroundColor: C.maroon, color: C.cream }}
      >
        <ThumbsUp size={11} /> {votes}
      </button>
    </div>
  );
}

export default function SoloRoulette({ onHome }) {
  const [cuisineFilter, setCuisineFilter] = useState(new Set());
  const [maxDistance, setMaxDistance] = useState(25);
  const [priceFilter, setPriceFilter] = useState(new Set());
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [priceEdit, setPriceEdit] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [boardText, setBoardText] = useState("PULL THE LEVER");
  const [spinCard, setSpinCard] = useState(null);
  const [spinTick, setSpinTick] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [groupMode, setGroupMode] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState({});
  const [sessionBlock, setSessionBlock] = useState(new Set());
  const [permaBlock, setPermaBlock] = useState(() => loadPerma());
  const [skipSheet, setSkipSheet] = useState(false);
  const [infoPlace, setInfoPlace] = useState(null);
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const intervalRef = useRef(null);
  const dragX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  const { restaurants, loading, error, label, needCity, setCity, useMyLocation } = useRestaurants({ cuisines: [...cuisineFilter], radiusMi: maxDistance });
  const [showCity, setShowCity] = useState(false);
  const [cityInput, setCityInput] = useState("");

  const cuisines = CUISINE_OPTIONS;

  const filterArgs = { maxDistance, cuisineFilter, priceFilter, sessionBlock, permaBlock, tiers };
  const pool = useMemo(() => filterPool(restaurants, filterArgs), [restaurants, maxDistance, cuisineFilter, priceFilter, sessionBlock, permaBlock, tiers]);

  function updateTier(i, key, raw) {
    const v = raw === "" ? 0 : Math.max(0, Number(raw) || 0);
    setTiers((cur) => cur.map((t, idx) => (idx === i ? { ...t, [key]: v } : t)));
  }

  function toggleSet(setFn, current, value) {
    const next = new Set(current);
    next.has(value) ? next.delete(value) : next.add(value);
    setFn(next);
  }

  // Cuisine chips: empty set = "all selected" (default). First tap narrows to
  // just that one; tapping the rest off returns to the all-selected default.
  function pickCuisine(c) {
    setCuisineFilter((prev) => {
      if (prev.size === 0) return new Set([c]);
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  function pickFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function runBoard(onDone) {
    setSpinning(true);
    let ticks = 0;
    const totalTicks = 18;
    intervalRef.current = setInterval(() => {
      if (pool.length) {
        const pick = pickFrom(pool);
        setBoardText(pick.name);
        setSpinCard(pick);
        setSpinTick((t) => t + 1);
      }
      ticks++;
      if (ticks >= totalTicks) {
        clearInterval(intervalRef.current);
        setSpinning(false);
        onDone();
      }
    }, 90);
  }

  function spin() {
    if (pool.length === 0 || spinning) return;
    setResult(null);
    setCandidates([]);
    setSkipSheet(false);
    if (groupMode) {
      runBoard(() => {
        const picks = [];
        const seen = new Set();
        let guard = 0;
        while (picks.length < Math.min(3, pool.length) && guard < 50) {
          const c = pickFrom(pool);
          if (!seen.has(c.name)) { seen.add(c.name); picks.push(c); }
          guard++;
        }
        setCandidates(picks);
        setVotes(Object.fromEntries(picks.map((p) => [p.name, 0])));
        setBoardText("VOTE BELOW");
      });
    } else {
      runBoard(() => {
        const winner = pickFrom(pool);
        setBoardText(winner.name);
        setResult(winner);
        setHistory((h) => [winner, ...h].slice(0, 4));
      });
    }
  }

  function skipOnce() {
    if (spinning || !result) return;
    setSkipSheet(false);
    const avoid = pool.filter((r) => r.name !== result.name);
    const source = avoid.length ? avoid : pool;
    runBoard(() => {
      const winner = pickFrom(source);
      setBoardText(winner.name);
      setResult(winner);
      setHistory((h) => [winner, ...h].slice(0, 4));
    });
  }

  function skipAndExclude(kind) {
    if (spinning || !result) return;
    const name = result.name;
    let nextSession = sessionBlock;
    let nextPerma = permaBlock;
    if (kind === "meal") {
      nextSession = new Set(sessionBlock).add(name);
      setSessionBlock(nextSession);
    } else if (kind === "forever") {
      nextPerma = new Set(permaBlock).add(name);
      setPermaBlock(nextPerma);
      savePerma(nextPerma);
    }
    setSkipSheet(false);
    const remaining = filterPool(restaurants, { ...filterArgs, sessionBlock: nextSession, permaBlock: nextPerma });
    if (remaining.length === 0) {
      setResult(null);
      setBoardText("NO MATCHES LEFT");
      return;
    }
    runBoard(() => {
      const winner = pickFrom(remaining);
      setBoardText(winner.name);
      setResult(winner);
      setHistory((h) => [winner, ...h].slice(0, 4));
    });
  }

  function chooseThisPlace() {
    if (sessionBlock.size > 0) setSessionBlock(new Set());
  }

  function reroll() {
    setSkipSheet(true);
  }

  function unhide(name) {
    const next = new Set(permaBlock);
    next.delete(name);
    setPermaBlock(next);
    savePerma(next);
  }

  function finishVoting() {
    const winnerName = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0];
    const winner = candidates.find((c) => c.name === winnerName) || candidates[0];
    setBoardText(winner.name);
    setResult(winner);
    setHistory((h) => [winner, ...h].slice(0, 4));
    setCandidates([]);
  }

  function onPointerDown(e) {
    dragX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  }
  function onPointerMove(e) {
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    setDragOffset(x - dragX.current);
  }
  function onPointerUp() {
    if (dragOffset < -60) skipOnce();
    setDragOffset(0);
  }

  // reusable inline styles for the two chip states
  const chipOn = { backgroundColor: C.maroon, border: `1px solid ${C.maroon}`, color: C.cream };
  const chipOff = { backgroundColor: "transparent", border: `1px solid ${C.hairline}`, color: C.creamDim };

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-8 px-3" style={{ backgroundColor: C.page }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto+Mono:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Oswald', sans-serif; }
        .font-mono { font-family: 'Roboto Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div
        className="relative w-full max-w-[400px] rounded-[2.2rem] shadow-2xl overflow-hidden font-body"
        style={{ backgroundColor: C.shell, border: `6px solid ${C.shellBorder}` }}
      >

        {/* Header */}
        <div className="px-5 pt-2 pb-4" style={{ borderBottom: `1px solid ${C.hairlineSoft}` }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight leading-none" style={{ color: C.cream }}>NEXT STOP</h1>
              <p className="font-mono text-[11px] mt-1 tracking-widest uppercase" style={{ color: C.amber }}>Restaurant Roulette</p>
            </div>
            <button
              onClick={onHome}
              className="flex items-center gap-1.5 text-[12px] font-display font-semibold px-3.5 py-2 rounded-full"
              style={{ backgroundColor: C.card, border: `1px solid ${C.hairline}`, color: C.cream }}
            >
              <ArrowLeft size={14} /> Modes
            </button>
          </div>
          <div className="mt-2">
            <p className="flex items-center gap-1 text-[12px]" style={{ color: C.muted }}>
              <MapPin size={12} />
              {loading ? "Finding your location…" : (label || "Set a location")}
              {!loading && ` · ${pool.length} spots`}
              <button onClick={() => setShowCity((s) => !s)} className="ml-1 font-mono text-[11px]" style={{ color: C.amber }}>change</button>
            </p>
            {(showCity || needCity) && (
              <div className="mt-2 flex gap-2">
                <input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="City or address"
                  className="flex-1 font-body text-[13px] px-3 py-2 rounded-lg outline-none"
                  style={{ backgroundColor: C.card, color: C.cream, border: `1px solid ${C.hairline}` }}
                />
                <button
                  onClick={() => { setCity(cityInput); setShowCity(false); }}
                  className="px-3 py-2 rounded-lg font-display font-semibold text-[12px]"
                  style={{ backgroundColor: C.maroon, color: C.cream }}
                >Go</button>
                <button
                  onClick={() => { useMyLocation(); setShowCity(false); }}
                  className="px-3 py-2 rounded-lg font-display font-semibold text-[12px]"
                  style={{ backgroundColor: C.card, color: C.cream, border: `1px solid ${C.hairline}` }}
                >📍</button>
              </div>
            )}
            {needCity && !loading && (
              <p className="text-[11px] font-body mt-1" style={{ color: C.creamDim }}>Location's off — type a city to search.</p>
            )}
            {error && <p className="text-[11px] font-body mt-1" style={{ color: "#FF9B9B" }}>{error}</p>}
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${C.hairlineSoft}` }}>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full flex items-center justify-between text-[13px] font-display font-medium tracking-wide"
            style={{ color: C.cream }}
          >
            <span>FILTERS</span>
            <ChevronDown size={16} className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          {filtersOpen && (
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-mono uppercase tracking-wide" style={{ color: C.muted }}>Cuisine</p>
                  {cuisineFilter.size > 0 && (
                    <button onClick={() => setCuisineFilter(new Set())} className="text-[11px] font-mono" style={{ color: C.amber }}>All</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cuisines.map((c) => (
                    <button
                      key={c}
                      onClick={() => pickCuisine(c)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-body transition-colors"
                      style={(cuisineFilter.size === 0 || cuisineFilter.has(c)) ? { ...chipOn, fontWeight: 600 } : chipOff}
                    >
                      <CuisineIcon cuisine={c} size={11} />
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-mono uppercase tracking-wide" style={{ color: C.muted }}>
                    Price / person <span style={{ textTransform: "none", opacity: 0.8 }}>· tap any that apply</span>
                  </p>
                  <button onClick={() => setPriceEdit((e) => !e)} className="text-[11px] font-mono" style={{ color: C.amber }}>
                    {priceEdit ? "done" : "edit"}
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {tiers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleSet(setPriceFilter, priceFilter, t.id)}
                      className="text-left text-[11px] px-2.5 py-1.5 rounded-lg font-body transition-colors"
                      style={priceFilter.has(t.id) ? { ...chipOn, fontWeight: 600 } : chipOff}
                    >
                      <div className="font-display leading-tight">{t.label}</div>
                      <div className="font-mono text-[10px] opacity-80 leading-tight">{fmtTier(t)}</div>
                    </button>
                  ))}
                </div>

                {priceEdit && (
                  <div className="mt-2 space-y-2 rounded-lg p-2.5" style={{ backgroundColor: C.fill }}>
                    <p className="text-[10px] font-body" style={{ color: C.muted }}>Set your own dollar ranges per person.</p>
                    {tiers.map((t, i) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <span className="w-16 text-[11px] font-display shrink-0" style={{ color: C.cream }}>{t.label}</span>
                        <span className="text-[11px] font-mono" style={{ color: C.muted }}>$</span>
                        <input
                          type="number" inputMode="numeric" min="0" value={t.min}
                          onChange={(e) => updateTier(i, "min", e.target.value)}
                          className="w-14 text-right font-mono text-[12px] px-2 py-1 rounded-md outline-none"
                          style={{ backgroundColor: C.card, color: C.cream, border: `1px solid ${C.hairline}` }}
                        />
                        {t.max >= 9999 ? (
                          <span className="text-[11px] font-mono" style={{ color: C.muted }}>and up</span>
                        ) : (
                          <>
                            <span className="text-[11px] font-mono" style={{ color: C.muted }}>to $</span>
                            <input
                              type="number" inputMode="numeric" min="0" value={t.max}
                              onChange={(e) => updateTier(i, "max", e.target.value)}
                              className="w-14 text-right font-mono text-[12px] px-2 py-1 rounded-md outline-none"
                              style={{ backgroundColor: C.card, color: C.cream, border: `1px solid ${C.hairline}` }}
                            />
                          </>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setTiers(DEFAULT_TIERS)} className="text-[10px] font-mono underline" style={{ color: C.muted }}>
                      reset to defaults
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-mono uppercase tracking-wide" style={{ color: C.muted }}>Max distance</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" inputMode="numeric" min="1" max="50" value={maxDistance}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") { setMaxDistance(1); return; }
                        setMaxDistance(Math.min(50, Math.max(1, Number(raw) || 1)));
                      }}
                      className="w-14 text-right font-mono text-[12px] px-2 py-1 rounded-md outline-none"
                      style={{ backgroundColor: C.card, color: C.cream, border: `1px solid ${C.hairline}` }}
                    />
                    <span className="text-[11px] font-mono" style={{ color: C.muted }}>mi</span>
                  </div>
                </div>
                <input
                  type="range" min="1" max="50" value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: C.maroon }}
                />
              </div>

              {(permaBlock.size > 0 || sessionBlock.size > 0) && (
                <div className="pt-1">
                  <button
                    onClick={() => setHiddenOpen((o) => !o)}
                    className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide"
                    style={{ color: C.muted }}
                  >
                    <EyeOff size={12} /> Hidden spots
                    <span style={{ color: C.amber }}>
                      {permaBlock.size} hidden{sessionBlock.size > 0 ? ` \u00b7 ${sessionBlock.size} skipped this meal` : ""}
                    </span>
                    <ChevronDown size={13} className={`transition-transform ${hiddenOpen ? "rotate-180" : ""}`} />
                  </button>
                  {hiddenOpen && (
                    <div className="mt-2 space-y-1">
                      {[...permaBlock].map((name) => (
                        <div key={name} className="flex items-center justify-between rounded px-2 py-1" style={{ backgroundColor: C.fill }}>
                          <span className="text-[11px] font-body truncate" style={{ color: C.creamDim }}>{name}</span>
                          <button onClick={() => unhide(name)} className="flex items-center gap-1 text-[10px] font-mono shrink-0" style={{ color: C.amber }}>
                            <Undo2 size={11} /> unhide
                          </button>
                        </div>
                      ))}
                      {sessionBlock.size > 0 && (
                        <button
                          onClick={() => setSessionBlock(new Set())}
                          className="text-[10px] font-mono underline mt-1"
                          style={{ color: C.muted }}
                        >
                          clear this meal's skips
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ticket — spins through options, then reveals */}
        <div className="px-5 pt-5 pb-2">
          {spinning ? (
            <SpinningTicket card={spinCard} tick={spinTick} />
          ) : result ? (
            <div
              className="rounded-xl overflow-hidden shadow-lg relative touch-pan-y select-none"
              style={{ backgroundColor: C.card, border: `1px solid ${C.hairline}`, transform: `translateX(${dragOffset}px) rotate(${dragOffset / 40}deg)`, transition: dragOffset === 0 ? "transform 0.2s" : "none" }}
              onMouseDown={onPointerDown}
              onMouseMove={(e) => e.buttons === 1 && onPointerMove(e)}
              onMouseUp={onPointerUp}
              onMouseLeave={() => dragOffset !== 0 && onPointerUp()}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
            >
              <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "repeating-linear-gradient(90deg,#E23636 0 8px,transparent 8px 16px)" }} />
              <div className="p-4 pt-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <CuisineIcon cuisine={result.cuisine} size={18} className="mt-1 shrink-0" style={{ color: C.amber }} />
                    <div>
                      <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: C.amber }}>Your Ticket</p>
                      <h2 className="font-display text-xl font-bold leading-tight mt-0.5" style={{ color: C.cream }}>{result.name}</h2>
                    </div>
                  </div>
                  <button onClick={() => setResult(null)} style={{ color: C.creamDim }}><X size={16} /></button>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[12px] font-body" style={{ color: C.creamDim }}>
                  <span className="flex items-center gap-1">
                    <Star size={12} style={{ fill: C.amberStar, color: C.amberStar }} />
                    {result.rating} ({result.ratingCount})
                  </span>
                  <span className="font-mono">{result.priceRange}/person</span>
                  <span>{result.distance.toFixed(1)} mi</span>
                </div>

                <p className="text-[12px] mt-1.5" style={{ color: C.creamDim }}>{result.address}</p>

                <div className="flex gap-2 mt-3">
                  <a href={`tel:${result.phone}`} onClick={chooseThisPlace}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-display font-medium py-2 rounded-md"
                    style={{ backgroundColor: C.flap, color: C.cream }}>
                    <Phone size={13} /> Call
                  </a>
                  <a
                    href={directionsUrl(result.name, result.address)}
                    target="_blank" rel="noreferrer" onClick={chooseThisPlace}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-display font-medium py-2 rounded-md"
                    style={{ backgroundColor: C.maroon, color: C.cream }}>
                    <Navigation size={13} /> Directions
                  </a>
                  <button onClick={reroll}
                    className="flex items-center justify-center gap-1 text-[12px] font-display font-medium py-2 px-3 rounded-md"
                    style={{ backgroundColor: C.fill, color: C.cream, border: `1px solid ${C.hairline}` }}>
                    <SkipForward size={13} />
                  </button>
                </div>
                <button onClick={() => setInfoPlace(result)}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 text-[12px] font-display font-medium py-2 rounded-md"
                  style={{ backgroundColor: C.fill, color: C.cream, border: `1px solid ${C.hairline}` }}>
                  <Info size={13} /> More info about this spot
                </button>
              </div>
            </div>
          ) : (
            <IdleTicket />
          )}
        </div>

        {/* Spin */}
        <div className="px-5 pb-4">
          <button
            onClick={spin}
            disabled={loading || pool.length === 0 || spinning}
            className="w-full flex items-center justify-center gap-2 font-display font-semibold tracking-wide py-3 rounded-lg text-sm active:scale-[0.98] transition-transform"
            style={loading || pool.length === 0 || spinning
              ? { backgroundColor: "#3A3D42", color: "#7A7F87" }
              : { backgroundColor: C.maroon, color: C.cream }}
          >
            <RotateCw size={16} className={spinning || loading ? "animate-spin" : ""} />
            {loading ? "LOADING…" : pool.length === 0 ? "NO MATCHES \u2014 ADJUST FILTERS" : spinning ? "SPINNING..." : "SPIN"}
          </button>
          {!groupMode && (
            <p className="text-center text-[10px] font-mono mt-2" style={{ color: "#6B7280" }}>
              swipe ticket left to skip once &middot; tap skip for more options
            </p>
          )}
        </div>

        {/* Group candidates */}
        {candidates.length > 0 && (
          <div className="mx-5 mb-4 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: C.muted }}>Everyone taps their pick</p>
            {candidates.map((c) => (
              <VoteCard key={c.name} r={c} votes={votes[c.name] || 0}
                onVote={() => setVotes((v) => ({ ...v, [c.name]: (v[c.name] || 0) + 1 }))} />
            ))}
            <button
              onClick={finishVoting}
              className="w-full flex items-center justify-center gap-2 font-display font-semibold py-2.5 rounded-lg text-sm active:scale-[0.98] transition-transform"
              style={{ backgroundColor: C.amber, color: C.flap }}
            >
              <Trophy size={15} /> LOCK IN WINNER
            </button>
          </div>
        )}

        {/* Result ticket now rendered above (unified spin+reveal ticket) */}

        {/* History */}
        {history.length > 1 && (
          <div className="px-5 pb-6">
            <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Previously drawn</p>
            <div className="flex flex-wrap gap-1.5">
              {history.slice(1).map((h, i) => (
                <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded font-mono" style={{ backgroundColor: C.fill, color: C.creamDim }}>
                  <CuisineIcon cuisine={h.cuisine} size={10} />
                  {h.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <TipBar />

        {/* Skip action sheet */}
        {skipSheet && result && (
          <div className="absolute inset-0 z-20 flex items-end" onClick={() => setSkipSheet(false)}>
            <div className="absolute inset-0" style={{ backgroundColor: C.page }} />
            <div
              className="relative w-full rounded-t-2xl p-4 pb-6"
              style={{ backgroundColor: C.shell, borderTop: `1px solid ${C.hairline}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: "rgba(255,255,255,0.20)" }} />
              <p className="text-[13px] font-display font-semibold mb-0.5" style={{ color: C.cream }}>Skip {result.name}?</p>
              <p className="text-[11px] font-body mb-3" style={{ color: C.creamDim }}>Choose how long to hide it.</p>

              <button onClick={skipOnce}
                className="w-full text-left px-3 py-2.5 rounded-lg mb-2"
                style={{ backgroundColor: C.card, border: `1px solid ${C.hairline}` }}>
                <div className="flex items-center gap-2 text-[13px] font-display font-medium" style={{ color: C.cream }}>
                  <SkipForward size={14} /> Not this time
                </div>
                <p className="text-[11px] font-body ml-6" style={{ color: C.creamDim }}>Just reroll — it can come back on the next spin.</p>
              </button>

              <button onClick={() => skipAndExclude("meal")}
                className="w-full text-left px-3 py-2.5 rounded-lg mb-2"
                style={{ backgroundColor: C.card, border: `1px solid ${C.hairline}` }}>
                <div className="flex items-center gap-2 text-[13px] font-display font-medium" style={{ color: C.cream }}>
                  <Undo2 size={14} /> Skip for this meal
                </div>
                <p className="text-[11px] font-body ml-6" style={{ color: C.creamDim }}>Hide until you pick a place, then it resets.</p>
              </button>

              <button onClick={() => skipAndExclude("forever")}
                className="w-full text-left px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: C.maroonDeep, border: `1px solid ${C.maroon}` }}>
                <div className="flex items-center gap-2 text-[13px] font-display font-medium" style={{ color: C.amber }}>
                  <EyeOff size={14} /> Never show again
                </div>
                <p className="text-[11px] font-body ml-6" style={{ color: "#E8D5D5" }}>Hide for good. Undo anytime under Hidden spots.</p>
              </button>
            </div>
          </div>
        )}
        {infoPlace && <PlaceInfo place={infoPlace} onClose={() => setInfoPlace(null)} />}
      </div>
    </div>
  );
}
