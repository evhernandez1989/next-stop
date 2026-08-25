import React, { useState, useEffect } from "react";
import { Download, Share, Plus } from "lucide-react";

// Small "Add to Home Screen" helper for the home screen.
// - Android/Chrome: uses the real install prompt when the browser offers one.
// - iPhone/iPad: shows the Share -> Add to Home Screen steps (iOS has no prompt API).
// - Hides itself if the app is already installed (running standalone).
const T = {
  card: "#173063", board: "#0E1B3D", cream: "#F4F7FF",
  muted: "#7C93C4", red: "#E23636", hairline: "rgba(90,150,255,0.20)",
};

export default function InstallHint() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState(null);
  const [platform, setPlatform] = useState("other");
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    setPlatform(/iPhone|iPad|iPod/i.test(ua) ? "ios" : /Android/i.test(ua) ? "android" : "other");
    const sa =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
    setStandalone(!!sa);
    const onBIP = (e) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (standalone) return null; // already installed — nothing to show

  const onClick = async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setOpen((o) => !o);
    }
  };

  const steps =
    platform === "ios"
      ? ["Tap the Share button in the browser toolbar.", 'Scroll down and tap "Add to Home Screen."', 'Tap "Add" — the icon lands on your home screen.']
      : platform === "android"
      ? ['Tap the browser menu (⋮, top right).', 'Tap "Add to Home screen" or "Install app."', "Confirm — the icon lands on your home screen."]
      : ["Open this page in your phone's browser.", 'Use the browser menu to "Add to Home Screen" / "Install."'];

  return (
    <div className="px-5 pb-2">
      <button onClick={onClick}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-display font-semibold"
        style={{ backgroundColor: T.board, color: T.cream, border: `1px solid ${T.hairline}` }}>
        <Download size={14} /> Add to Home Screen
      </button>

      {open && !deferred && (
        <div className="mt-2 rounded-lg p-3" style={{ backgroundColor: T.board, border: `1px solid ${T.hairline}` }}>
          <p className="flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-wide mb-2" style={{ color: T.red }}>
            {platform === "ios" ? <Share size={12} /> : <Plus size={12} />}
            {platform === "ios" ? "On iPhone / iPad" : platform === "android" ? "On Android" : "On your phone"}
          </p>
          <ol className="text-[13px] font-body space-y-1.5" style={{ color: T.cream }}>
            {steps.map((s, i) => (
              <li key={i}>{i + 1}. {s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
