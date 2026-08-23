import { useState } from "react";
import TipBar from "./TipBar";
import ReactDOM from "react-dom/client";
import { Users, User, MapPin, ChevronRight, Dices } from "lucide-react";
import SoloRoulette from "./SoloRoulette.jsx";
import NextStopMultiplayer from "./NextStopMultiplayer.jsx";
import "./index.css";

const C = {
  page: "#0D1013", shell: "#20262E", shellBorder: "#0A0C0E", card: "#2E3742",
  amber: "#F2B705", cream: "#F5EFE0", creamDim: "#C7CDD6", muted: "#8B93A1",
  maroon: "#7A2E2E", hairline: "rgba(255,255,255,0.10)", fill: "rgba(255,255,255,0.06)",
};

function HomeScreen({ onSolo, onGroup }) {
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
        <div className="px-5 pt-10 pb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: C.maroon }}>
            <Dices size={30} style={{ color: C.cream }} />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight leading-none" style={{ color: C.cream }}>NEXT STOP</h1>
          <p className="font-mono text-[11px] mt-2 tracking-widest uppercase" style={{ color: C.amber }}>Restaurant Roulette</p>
          <p className="flex items-center gap-1 text-[12px] mt-3" style={{ color: C.muted }}>
            <MapPin size={12} /> Restaurants near you
          </p>
        </div>
        <div className="px-5 pb-8">
          <p className="text-[11px] font-mono uppercase tracking-wide mb-3" style={{ color: C.muted }}>How do you want to decide?</p>
          <button onClick={onSolo}
            className="w-full flex items-center justify-between px-4 py-4 rounded-xl mb-3 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: C.maroon, color: C.cream }}>
            <span className="flex items-center gap-3">
              <User size={20} />
              <span className="text-left">
                <span className="block font-display font-semibold text-[15px] leading-tight">Just me</span>
                <span className="block text-[11px] font-body leading-tight" style={{ color: "#E8D5D5" }}>Spin solo with filters &amp; skips</span>
              </span>
            </span>
            <ChevronRight size={18} />
          </button>
          <button onClick={onGroup}
            className="w-full flex items-center justify-between px-4 py-4 rounded-xl active:scale-[0.98] transition-transform"
            style={{ backgroundColor: C.card, color: C.cream, border: `1px solid ${C.hairline}` }}>
            <span className="flex items-center gap-3">
              <Users size={20} style={{ color: C.amber }} />
              <span className="text-left">
                <span className="block font-display font-semibold text-[15px] leading-tight">With a group</span>
                <span className="block text-[11px] font-body leading-tight" style={{ color: C.creamDim }}>Everyone joins &amp; votes from their phone</span>
              </span>
            </span>
            <ChevronRight size={18} style={{ color: C.muted }} />
          </button>
          <div className="mt-8 rounded-xl p-3" style={{ backgroundColor: C.fill }}>
            <p className="text-[12px] font-body leading-snug" style={{ color: C.creamDim }}>
              Solo picks instantly on this phone. Group mode gives you a room link others scan or tap to join — then the whole table votes together.
            </p>
          </div>

          <TipBar />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("room") ? "group" : "home"; }
    catch { return "home"; }
  });
  if (mode === "solo") return <SoloRoulette onHome={() => setMode("home")} />;
  if (mode === "group") return <NextStopMultiplayer onHome={() => setMode("home")} />;
  return <HomeScreen onSolo={() => setMode("solo")} onGroup={() => setMode("group")} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// Register the service worker so the app is installable (Add to Home Screen).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
