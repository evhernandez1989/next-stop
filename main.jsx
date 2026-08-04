import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  MapPin, Users, Copy, Check, Crown, ArrowLeft, RotateCw, Wifi,
  UserPlus, ChevronRight, Beef, Beer, Coffee, Fish, Pizza,
  UtensilsCrossed, Sparkles, ThumbsUp, Trophy, Star, Phone, Navigation,
} from "lucide-react";
import { useRoom } from "./lib/useRoom";

const C = {
  page: "#0D1013", shell: "#20262E", shellBorder: "#0A0C0E", card: "#2E3742",
  board: "#1B1F26", flap: "#14171B", amber: "#F2B705", amberStar: "#E8A33D",
  cream: "#F5EFE0", creamDim: "#C7CDD6", muted: "#8B93A1", maroon: "#7A2E2E",
  maroonDeep: "#3A2222", green: "#4FB477", hairline: "rgba(255,255,255,0.10)",
  hairlineSoft: "rgba(255,255,255,0.06)", fill: "rgba(255,255,255,0.06)",
};

const CUISINE_ICONS = {
  American: UtensilsCrossed, Eclectic: Sparkles, Seafood: Fish, Breakfast: Coffee,
  "Cafe & Brunch": Coffee, Brewpub: Beer, Steakhouse: Beef, Diner: UtensilsCrossed,
  Italian: Pizza, "Brewery & Grill": Beer,
};
const AVATAR_COLORS = ["#7A2E2E", "#2E6B7A", "#7A5C2E", "#4A2E7A", "#2E7A4A"];

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function initials(name) { return (name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase(); }
function CuisineIcon({ cuisine, size = 12, style }) { const Icon = CUISINE_ICONS[cuisine] || UtensilsCrossed; return <Icon size={size} style={style} />; }

function Frame({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center py-8 px-3" style={{ backgroundColor: C.page }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto+Mono:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Oswald', sans-serif; }
        .font-mono { font-family: 'Roboto Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>
      <div className="relative w-full max-w-[400px] rounded-[2.2rem] shadow-2xl overflow-hidden font-body"
        style={{ backgroundColor: C.shell, border: `6px solid ${C.shellBorder}`, minHeight: 640 }}>
        <div className="flex justify-between items-center px-6 pt-3 pb-1 text-[11px] font-mono" style={{ color: C.muted }}>
          <span>9:41</span><span>NEXT STOP</span><span>100%</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Avatar({ name, host }) {
  const color = AVATAR_COLORS[hashStr(name || "?") % AVATAR_COLORS.length];
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-semibold text-[13px]"
          style={{ backgroundColor: color, color: C.cream }}>{initials(name)}</div>
        {host && (
          <div className="absolute -top-1 -right-1 rounded-full p-0.5" style={{ backgroundColor: C.shell }}>
            <Crown size={11} style={{ color: C.amber }} />
          </div>
        )}
      </div>
      <div>
        <p className="text-[13px] font-body font-medium leading-tight" style={{ color: C.cream }}>{name}</p>
        <p className="text-[10px] font-mono leading-tight" style={{ color: host ? C.amber : C.muted }}>{host ? "host" : "ready"}</p>
      </div>
    </div>
  );
}

function Roster({ players, count }) {
  return (
    <div className="px-5 pt-4 pb-2">
      <p className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wide mb-2" style={{ color: C.muted }}>
        <span>In the room</span><span style={{ color: C.amber }}>{count} joined</span>
      </p>
      <div className="space-y-2.5 rounded-xl p-3" style={{ backgroundColor: C.fill }}>
        {players.map((p) => <Avatar key={p.device_id} name={p.name} host={p.is_host} />)}
      </div>
    </div>
  );
}

export default function NextStopMultiplayer() {
  const r = useRoom();
  const [name, setName] = useState("");
  const [screen, setScreen] = useState("entry"); // entry | joinEntry
  const [joinInput, setJoinInput] = useState(() => {
    try { return (new URLSearchParams(window.location.search).get("room") || "").replace(/^NEXT-/i, ""); } catch { return ""; }
  });
  const [copied, setCopied] = useState(false);

  // If a ?room= link brought them here and they haven't joined, send them to join.
  const prefilledFromLink = joinInput.length > 0 && !r.code && screen === "entry";
  if (prefilledFromLink) setScreen("joinEntry");

  const shareUrl = r.code ? `${window.location.origin}/?room=${r.code}` : "";

  function copyLink() {
    try { navigator.clipboard?.writeText(shareUrl); } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  }

  // ── Not in a room yet ──
  if (!r.code) {
    if (screen === "entry") {
      return (
        <Frame>
          <div className="px-5 pt-2 pb-4" style={{ borderBottom: `1px solid ${C.hairlineSoft}` }}>
            <h1 className="font-display text-3xl font-bold tracking-tight leading-none" style={{ color: C.cream }}>NEXT STOP</h1>
            <p className="font-mono text-[11px] mt-1 tracking-widest uppercase" style={{ color: C.amber }}>Group Roulette</p>
          </div>
          <div className="px-5 pt-6 pb-4">
            <p className="flex items-center gap-1 text-[12px] mb-6" style={{ color: C.muted }}>
              <MapPin size={12} /> Ingalls, IN &middot; 21 spots in range
            </p>
            {r.error && <p className="text-[12px] mb-3" style={{ color: "#FF9B9B" }}>{r.error}</p>}
            <NameField name={name} setName={setName} />
            <button
              onClick={async () => { if (name.trim()) await r.createRoom(name.trim()); }}
              disabled={!name.trim() || r.busy}
              className="w-full flex items-center justify-between px-4 py-4 rounded-xl mt-4 mb-3 active:scale-[0.98] transition-transform"
              style={name.trim() && !r.busy ? { backgroundColor: C.maroon, color: C.cream } : { backgroundColor: "#3A3D42", color: "#7A7F87" }}>
              <span className="flex items-center gap-3">
                <Users size={20} />
                <span className="text-left">
                  <span className="block font-display font-semibold text-[15px] leading-tight">Start a group session</span>
                  <span className="block text-[11px] font-body leading-tight" style={{ color: "#E8D5D5" }}>Host a room, share the link</span>
                </span>
              </span>
              <ChevronRight size={18} />
            </button>
            <button onClick={() => setScreen("joinEntry")}
              className="w-full flex items-center justify-between px-4 py-4 rounded-xl active:scale-[0.98] transition-transform"
              style={{ backgroundColor: C.card, color: C.cream, border: `1px solid ${C.hairline}` }}>
              <span className="flex items-center gap-3">
                <UserPlus size={20} style={{ color: C.amber }} />
                <span className="text-left">
                  <span className="block font-display font-semibold text-[15px] leading-tight">Join with a code</span>
                  <span className="block text-[11px] font-body leading-tight" style={{ color: C.creamDim }}>Someone sent you a room code</span>
                </span>
              </span>
              <ChevronRight size={18} style={{ color: C.muted }} />
            </button>
          </div>
        </Frame>
      );
    }
    // joinEntry
    const suffix = joinInput.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    const canJoin = suffix.length === 4 && name.trim().length > 0 && !r.busy;
    return (
      <Frame>
        <div className="px-5 pt-2 pb-4" style={{ borderBottom: `1px solid ${C.hairlineSoft}` }}>
          <h1 className="font-display text-3xl font-bold tracking-tight leading-none" style={{ color: C.cream }}>NEXT STOP</h1>
          <p className="font-mono text-[11px] mt-1 tracking-widest uppercase" style={{ color: C.amber }}>Join a Room</p>
        </div>
        <div className="px-5 pt-6 pb-4">
          <button onClick={() => setScreen("entry")} className="flex items-center gap-1 text-[12px] font-mono mb-5" style={{ color: C.muted }}>
            <ArrowLeft size={13} /> back
          </button>
          {r.error && <p className="text-[12px] mb-3" style={{ color: "#FF9B9B" }}>{r.error}</p>}
          <p className="text-[11px] font-mono uppercase tracking-wide mb-2" style={{ color: C.muted }}>Room code</p>
          <div className="flex items-center gap-2 mb-5">
            <span className="font-display text-2xl font-bold tracking-widest" style={{ color: C.muted }}>NEXT-</span>
            <input value={suffix} onChange={(e) => setJoinInput(e.target.value)} placeholder="7Q2X"
              className="w-[130px] font-display text-2xl font-bold tracking-[0.2em] px-3 py-1.5 rounded-lg outline-none"
              style={{ backgroundColor: C.card, color: C.cream, border: `1px solid ${C.hairline}`, textTransform: "uppercase" }} />
          </div>
          <NameField name={name} setName={setName} />
          <button onClick={async () => { if (canJoin) await r.joinRoom(suffix, name.trim()); }} disabled={!canJoin}
            className="w-full flex items-center justify-center gap-2 font-display font-semibold tracking-wide py-3 rounded-lg text-sm mt-6 active:scale-[0.98] transition-transform"
            style={canJoin ? { backgroundColor: C.maroon, color: C.cream } : { backgroundColor: "#3A3D42", color: "#7A7F87" }}>
            <UserPlus size={16} /> JOIN ROOM
          </button>
        </div>
      </Frame>
    );
  }

  // ── In a room: branch on status ──
  const status = r.room?.status || "lobby";
  const playerCount = r.players.length;

  const RoomHeader = ({ label, connected }) => (
    <div className="px-5 pt-3 pb-3" style={{ borderBottom: `1px solid ${C.hairlineSoft}` }}>
      <button onClick={r.leaveRoom} className="flex items-center gap-1 text-[12px] font-mono mb-2" style={{ color: C.muted }}>
        <ArrowLeft size={13} /> leave
      </button>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: C.fill, color: C.green }}>
          <Wifi size={10} /> {connected}
        </span>
        <p className="font-mono text-[11px] tracking-widest uppercase" style={{ color: C.amber }}>{label}</p>
      </div>
    </div>
  );

  if (status === "lobby") {
    return (
      <Frame>
        <RoomHeader label={r.isHost ? "Your Room" : r.code} connected="LIVE" />
        {r.isHost ? (
          <>
            <div className="px-5 pt-4 pb-2 flex flex-col items-center">
              <div style={{ backgroundColor: C.cream, padding: 10, borderRadius: 12, lineHeight: 0 }}>
                <QRCodeSVG value={shareUrl} size={132} bgColor={C.cream} fgColor={C.flap} />
              </div>
              <span className="mt-3 font-display text-2xl font-bold tracking-[0.15em]" style={{ color: C.cream }}>{r.code}</span>
              <button onClick={copyLink}
                className="mt-2 flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                style={{ backgroundColor: C.fill, color: copied ? C.green : C.creamDim, border: `1px solid ${C.hairline}` }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Link copied" : "Copy invite link"}
              </button>
            </div>
            <Roster players={r.players} count={playerCount} />
            <div className="px-5 pt-3 pb-6">
              <button onClick={r.spin}
                className="w-full flex items-center justify-center gap-2 font-display font-semibold tracking-wide py-3 rounded-lg text-sm active:scale-[0.98] transition-transform"
                style={{ backgroundColor: C.maroon, color: C.cream }}>
                <RotateCw size={16} /> START SPINNING
              </button>
              <p className="text-center text-[10px] font-mono mt-2" style={{ color: C.muted }}>everyone votes on their own phone</p>
            </div>
          </>
        ) : (
          <>
            <div className="px-5 pt-8 pb-4 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: C.fill }}>
                <RotateCw size={24} style={{ color: C.amber }} />
              </div>
              <p className="font-display text-lg font-semibold" style={{ color: C.cream }}>You're in the room</p>
              <p className="text-[13px] font-body mt-1" style={{ color: C.creamDim }}>Waiting for the host to spin. Candidates will pop up here for everyone at once.</p>
            </div>
            <Roster players={r.players} count={playerCount} />
          </>
        )}
      </Frame>
    );
  }

  if (status === "voting") {
    const tally = {};
    r.votes.forEach((v) => { tally[v.choice] = (tally[v.choice] || 0) + 1; });
    const totalVotes = r.votes.length;
    const cands = r.room?.candidates || [];
    return (
      <Frame>
        <RoomHeader label={r.code} connected="LIVE" />
        <div className="px-5 pt-4 pb-2">
          <p className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wide mb-3" style={{ color: C.muted }}>
            <span>Tap your pick</span>
            <span style={{ color: C.amber }}>{totalVotes}/{playerCount} voted</span>
          </p>
          <div className="space-y-2.5">
            {cands.map((c) => {
              const count = tally[c.name] || 0;
              const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
              const mine = r.myVote === c.name;
              return (
                <button key={c.name} onClick={() => r.castVote(c.name)}
                  className="w-full text-left rounded-lg p-3 relative overflow-hidden active:scale-[0.99] transition-transform"
                  style={{ backgroundColor: C.card, border: mine ? `1px solid ${C.amber}` : `1px solid ${C.hairline}` }}>
                  <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, backgroundColor: "rgba(242,183,5,0.12)", transition: "width 0.3s" }} />
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CuisineIcon cuisine={c.cuisine} style={{ color: C.amber }} />
                        <p className="font-display font-semibold text-[14px] truncate" style={{ color: C.cream }}>{c.name}</p>
                      </div>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: C.creamDim }}>{c.priceRange} &middot; {c.distance.toFixed(1)} mi &middot; {c.rating}★</p>
                    </div>
                    <span className="flex items-center gap-1 text-[13px] font-display font-semibold shrink-0" style={{ color: mine ? C.amber : C.creamDim }}>
                      <ThumbsUp size={13} /> {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {r.isHost && (
          <div className="px-5 pt-4 pb-6">
            <button onClick={r.lockIn}
              className="w-full flex items-center justify-center gap-2 font-display font-semibold py-3 rounded-lg text-sm active:scale-[0.98] transition-transform"
              style={{ backgroundColor: C.amber, color: C.flap }}>
              <Trophy size={15} /> LOCK IN WINNER
            </button>
            <p className="text-center text-[10px] font-mono mt-2" style={{ color: C.muted }}>you can lock in anytime — highest votes wins</p>
          </div>
        )}
        {!r.isHost && (
          <p className="px-5 pt-4 pb-6 text-center text-[11px] font-mono" style={{ color: C.muted }}>waiting for the host to lock in the winner…</p>
        )}
      </Frame>
    );
  }

  // revealed
  const w = r.room?.winner;
  return (
    <Frame>
      <RoomHeader label={r.code} connected="LIVE" />
      <div className="px-5 pt-6 pb-2 flex flex-col items-center">
        <div className="flex items-center gap-1.5 mb-3">
          <Trophy size={16} style={{ color: C.amber }} />
          <p className="font-mono text-[11px] tracking-widest uppercase" style={{ color: C.amber }}>The group picked</p>
        </div>
      </div>
      {w && (
        <div className="mx-5 mb-4 rounded-xl overflow-hidden shadow-lg relative" style={{ backgroundColor: C.card, border: `1px solid ${C.hairline}` }}>
          <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "repeating-linear-gradient(90deg,#7A2E2E 0 8px,transparent 8px 16px)" }} />
          <div className="p-4 pt-5">
            <div className="flex items-start gap-2">
              <CuisineIcon cuisine={w.cuisine} size={18} style={{ color: C.amber, marginTop: 4 }} />
              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: C.amber }}>Winner</p>
                <h2 className="font-display text-xl font-bold leading-tight mt-0.5" style={{ color: C.cream }}>{w.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[12px] font-body" style={{ color: C.creamDim }}>
              <span className="flex items-center gap-1"><Star size={12} style={{ fill: C.amberStar, color: C.amberStar }} />{w.rating} ({w.ratingCount})</span>
              <span className="font-mono">{w.priceRange}/person</span>
              <span>{w.distance?.toFixed(1)} mi</span>
            </div>
            <p className="text-[12px] mt-1.5" style={{ color: C.creamDim }}>{w.address}</p>
            <div className="flex gap-2 mt-3">
              <a href={`tel:${w.phone}`} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-display font-medium py-2 rounded-md" style={{ backgroundColor: C.flap, color: C.cream }}>
                <Phone size={13} /> Call
              </a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w.name + " " + w.address)}`} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-display font-medium py-2 rounded-md" style={{ backgroundColor: C.maroon, color: C.cream }}>
                <Navigation size={13} /> Directions
              </a>
            </div>
          </div>
        </div>
      )}
      {r.isHost && (
        <div className="px-5 pt-2 pb-6 space-y-2">
          <button onClick={r.spin} className="w-full flex items-center justify-center gap-2 font-display font-semibold py-3 rounded-lg text-sm active:scale-[0.98] transition-transform" style={{ backgroundColor: C.maroon, color: C.cream }}>
            <RotateCw size={15} /> SPIN AGAIN
          </button>
          <button onClick={r.resetToLobby} className="w-full flex items-center justify-center gap-2 font-display font-medium py-2.5 rounded-lg text-[13px]" style={{ backgroundColor: C.fill, color: C.creamDim, border: `1px solid ${C.hairline}` }}>
            Back to lobby
          </button>
        </div>
      )}
      {!r.isHost && (
        <p className="px-5 pt-2 pb-6 text-center text-[11px] font-mono" style={{ color: C.muted }}>the host can spin again from here</p>
      )}
    </Frame>
  );
}

function NameField({ name, setName }) {
  return (
    <div>
      <p className="text-[11px] font-mono uppercase tracking-wide mb-2" style={{ color: "#8B93A1" }}>Your name</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sam"
        className="w-full font-body text-[15px] px-3 py-2.5 rounded-lg outline-none"
        style={{ backgroundColor: "#2E3742", color: "#F5EFE0", border: "1px solid rgba(255,255,255,0.10)" }} />
    </div>
  );
}
