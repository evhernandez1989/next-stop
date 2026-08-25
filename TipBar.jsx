import React from "react";

// Tip jar shown across the app. Handles live here only — change them in one place.
const T = {
  card: "#173063",
  cream: "#F4F7FF",
  muted: "#7C93C4",
  hairline: "rgba(90,150,255,0.20)",
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
      <p className="text-[12px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>
        ☕ Enjoying Next Stop?
      </p>
      <div className="flex gap-2 justify-center">
        <a href={CASHAPP_URL} target="_blank" rel="noreferrer"
          className="flex-1 max-w-[160px] text-center py-2 rounded-lg text-[13px] font-display font-semibold"
          style={btn}>
          Tip via Cash App
        </a>
        <a href={VENMO_URL} target="_blank" rel="noreferrer"
          className="flex-1 max-w-[160px] text-center py-2 rounded-lg text-[13px] font-display font-semibold"
          style={btn}>
          Tip via Venmo
        </a>
      </div>
    </div>
  );
}
