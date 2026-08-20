import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import { getDeviceId } from "./deviceId";
import { DATA, pickN } from "./restaurants";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode() {
  let s = "";
  for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return "NEXT-" + s;
}

// Owns all realtime state for one room. Returns the room row, roster, votes,
// and the actions the UI calls. Screens stay presentational.
export function useRoom() {
  const deviceId = getDeviceId();
  const [code, setCode] = useState([]);
  const [room, setRoom] = useState([]);      // rooms row
  const [players, setPlayers] = useState([]);  // players rows
  const [votes, setVotes] = useState([]);      // votes rows
  const [error, setError] = useState([]);
  const [busy, setBusy] = useState(false);
  const channelRef = useRef([]);

  const isHost = !!room && room.host_id === deviceId;
  const myVote = votes.find((v) => v.device_id === deviceId)?.choice || null;

  // ── Load current snapshot of a room, then subscribe to live changes ──
  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    async function loadAll() {
      const [{ data: r }, { data: pl }, { data: vt }] = await Promise.all([
        supabase.from("rooms").select("*").eq("code", code).maybeSingle(),
        supabase.from("players").select("*").eq("room_code", code).order("joined_at"),
        supabase.from("votes").select("*").eq("room_code", code),
      ]);
      if (cancelled) return;
      setRoom(r || null);
      setPlayers(pl || []);
      setVotes(vt || []);
    }
    loadAll();

    const channel = supabase
      .channel(`room:${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => setRoom(payload.eventType === "DELETE" ? null : payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `room_code=eq.${code}` },
        () => refreshPlayers(code))
      .on("postgres_changes", { event: "*", schema: "public", table: "votes", filter: `room_code=eq.${code}` },
        () => refreshVotes(code))
      .subscribe();

    channelRef.current = channel;
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [code]);

  async function refreshPlayers(c) {
    const { data } = await supabase.from("players").select("*").eq("room_code", c).order("joined_at");
    setPlayers(data || []);
  }
  async function refreshVotes(c) {
    const { data } = await supabase.from("votes").select("*").eq("room_code", c);
    setVotes(data || []);
  }

  // ── Host: create a new room ──
  const createRoom = useCallback(async (name) => {
    setBusy(true); setError(null);
    try {
      let c = randomCode();
      // Retry once on the rare code collision.
      let insert = await supabase.from("rooms").insert({ code: c, host_id: deviceId, status: "lobby" });
      if (insert.error) { c = randomCode(); insert = await supabase.from("rooms").insert({ code: c, host_id: deviceId, status: "lobby" }); }
      if (insert.error) throw insert.error;
      await supabase.from("players").upsert({ room_code: c, device_id: deviceId, name, is_host: true });
      setCode(c);
      return c;
    } catch (e) {
      setError("Couldn't create the room. Try again.");
      return null;
    } finally { setBusy(false); }
  }, [deviceId]);

  // ── Player: join an existing room ──
  const joinRoom = useCallback(async (rawCode, name) => {
    setBusy(true); setError(null);
    const c = rawCode.toUpperCase().startsWith("NEXT-") ? rawCode.toUpperCase() : "NEXT-" + rawCode.toUpperCase();
    try {
      const { data: r } = await supabase.from("rooms").select("code").eq("code", c).maybeSingle();
      if (!r) { setError("No room with that code."); return null; }
      await supabase.from("players").upsert({ room_code: c, device_id: deviceId, name, is_host: false });
      setCode(c);
      return c;
    } catch (e) {
      setError("Couldn't join. Check the code and try again.");
      return null;
    } finally { setBusy(false); }
  }, [deviceId]);

  // ── Host: spin — everyone enters the spin phase; the foreground client advances it ──
  const spin = useCallback(async (poolList) => {
    if (!code) return;
    const source = Array.isArray(poolList) && poolList.length ? poolList : DATA;
    const candidates = pickN(source, 3);
    await supabase.from("votes").delete().eq("room_code", code);
    await supabase.from("rooms").update({ candidates, winner: null, status: "spinning" }).eq("code", code);
  }, [code]);

  // Open voting after the spin. Guarded so it only fires while still spinning;
  // any foreground client can call it and the first one wins (others no-op).
  const endSpin = useCallback(async () => {
    if (!code) return;
    await supabase.from("rooms").update({ status: "voting" }).eq("code", code).eq("status", "spinning");
  }, [code]);

  // ── Any player: cast/'change vote (upsert keeps it one-per-device) ──
  const castVote = useCallback(async (choice) => {
    if (!code) return;
    await supabase.from("votes").upsert({ room_code: code, device_id: deviceId, choice, updated_at: new Date().toISOString() });
  }, [code, deviceId]);

  // ── Host: lock in — tally votes, set winner, reveal to everyone ──
  const lockIn = useCallback(async () => {
    if (!code || !room) return;
    const tally = {};
    votes.forEach((v) => { tally[v.choice] = (tally[v.choice] || 0) + 1; });
    const cands = room.candidates || [];
    let winnerName = cands[0]?.name;
    let best = -1;
    cands.forEach((c) => { const n = tally[c.name] || 0; if (n > best) { best = n; winnerName = c.name; } });
    const winner = cands.find((c) => c.name === winnerName) || cands[0];
    await supabase.from("rooms").update({ winner, status: "revealed" }).eq("code", code);
  }, [code, room, votes]);

  // ── Host: back to lobby / spin again ──
  const resetToLobby = useCallback(async () => {
    if (!code) return;
    await supabase.from("votes").delete().eq("room_code", code);
    await supabase.from("rooms").update({ candidates: [], winner: null, status: "lobby" }).eq("code", code);
  }, [code]);

  // ── Leave the room (remove this player) ──
  const leaveRoom = useCallback(async () => {
    if (code) await supabase.from("players").delete().eq("room_code", code).eq("device_id", deviceId);
    setCode(null); setRoom(null); setPlayers([]); setVotes([]);
  }, [code, deviceId]);

  return {
    deviceId, code, room, players, votes, error, busy, isHost, myVote,
    createRoom, joinRoom, spin, endSpin, castVote, lockIn, resetToLobby, leaveRoom,
  };
}
