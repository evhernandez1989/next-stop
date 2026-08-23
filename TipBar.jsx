import React from "react";

// Tip jar shown across the app. Handles live here only — change them in one place.
const T = {
  card: "#2E3742",
  cream: "#F5EFE0",
  muted: "#8B93A1",
  hairline: "rgba(255,255,255,0.10)",
};

const CASHAPP_URL = "https://cash.app/$adubbsking24";
const VENMO_URL = "https://venmo.com/u/Ellie-Hernandez";

export default function TipBar() {
  const btn = {
    backgroundColor: T.card,
    color: T.cream,
    border: `1px solid ${T.hairline}`,
  };
  return (
    <div className="px-5 pt-3 pb-6 text-center">
      <p className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>
        ☕ Enjoying Next Stop?
      </p>
      <div className="flex gap-2 justify-center">
        <a href={CASHAPP_URL} target="_blank" rel="noreferrer"
          className="flex-1 max-w-[160px] text-center py-2 rounded-lg text-[12px] font-display font-semibold"
          style={btn}>
          Tip via Cash App
        </a>
        <a href={VENMO_URL} target="_blank" rel="noreferrer"
          className="flex-1 max-w-[160px] text-center py-2 rounded-lg text-[12px] font-display font-semibold"
          style={btn}>
          Tip via Venmo
        </a>
      </div>
    </div>
  );
}
