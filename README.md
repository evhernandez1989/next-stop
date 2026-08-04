# Next Stop — Multiplayer Restaurant Roulette

A group picks a restaurant together: the host spins, three candidates appear on
everyone's phone, each person votes from their own device, and the winner reveals
for the whole room at once. Real-time sync runs on Supabase; the app deploys to
Vercel. Everything here fits inside both services' free tiers at friends-and-family
scale.

## What's in here

```
index.html                 app shell
vite.config.js             build config
package.json               dependencies
.env.example               copy to .env.local and fill in
supabase/schema.sql        run this once in your Supabase project
src/
  main.jsx                 entry point
  NextStopMultiplayer.jsx  all screens (entry, lobby, voting, reveal)
  lib/
    supabase.js            Supabase client (reads env vars)
    deviceId.js            stable per-device id (one player / one vote)
    restaurants.js         snapshot data + helpers (swap for live Places later)
    useRoom.js             all the realtime logic (create/join/spin/vote/lock-in)
```

## Setup (about 15 minutes)

### 1. Create a Supabase project
- Sign up at supabase.com (free), create a new project.
- When it's ready, open **SQL Editor**, paste the contents of
  `supabase/schema.sql`, and click **Run**. That creates the `rooms`, `players`,
  and `votes` tables, turns on realtime for them, and sets permissive
  policies for launch.

### 2. Get your keys
- Supabase → **Project Settings → API**. Copy the **Project URL** and the
  **anon public** key.
- Copy `.env.example` to `.env.local` and paste them in:
  ```
  VITE_SUPABASE_URL=https://yourproject.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  ```

### 3. Run it locally
```
npm install
npm run dev
```
Open the printed URL. To test multiplayer on one machine, open it in two browser
windows (use one normal + one incognito so they get different device ids), or
open it on your phone and laptop at the same time.

### 4. Deploy to Vercel
- Push this folder to a GitHub repo.
- On vercel.com → **Add New Project** → import the repo. Vite is auto-detected.
- Before deploying, add the two environment variables (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`) under the project's **Environment Variables**.
- Deploy. Your live URL (e.g. `next-stop.vercel.app`) is what the room links and
  QR codes point to.

## How it works

- Each room is a row in `rooms` with a short code (`NEXT-7Q2X`) and a `status`
  of `lobby` → `voting` → `revealed`.
- Every phone in the room subscribes to Supabase realtime changes on the three
  tables, so roster, votes, and status updates arrive instantly.
- The host's **spin** picks three restaurants, writes them to the room, and
  flips status to `voting`. Votes upsert one row per device (so a person is one
  vote and can change their mind). **Lock in** tallies the votes, writes the
  winner, and flips status to `revealed` for everyone.

## Turning the snapshot into live data (later)

`src/lib/restaurants.js` currently ships a fixed list near Ingalls, IN. To go
live, replace `loadRestaurants()` with a call to a small serverless function
(e.g. a Vercel function) that calls the Google Places **Nearby Search** API with
your key kept server-side, and returns results in the same shape. Nothing else
in the app needs to change.

## Before a wider launch

The row-level-security policies in `schema.sql` are intentionally open so you can
ship fast — anyone with the anon key can read/write any room. That's fine for
friends and family. Before promoting it publicly, scope writes to a room's own
players (via a device header check or Supabase Auth) and add basic rate limiting.
```
```
