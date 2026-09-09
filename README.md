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
tailwind.config.js         Tailwind setup
package.json               dependencies
env.example                copy to .env.local and fill in
schema.sql                 run this once in your Supabase project

main.jsx                   entry point
NextStopMultiplayer.jsx    multiplayer screens (entry, lobby, voting, reveal)
SoloRoulette.jsx           single-player mode
PlaceInfo.jsx              "More info" detail panel for one restaurant
TipBar.jsx                 hint bar
InstallHint.jsx            PWA "add to home screen" prompt
supabase.js                Supabase client (reads env vars)
deviceId.js                stable per-device id (one player / one vote)
restaurants.js             static fallback data + cuisine options
useRoom.js                 all the realtime logic (create/join/spin/vote/lock-in)
useRestaurants.js          fetches live results from /api/restaurants

api/
  restaurants.js           serverless: Google Places search, key stays server-side
  place.js                 serverless: on-demand detail for one place

public/                    PWA manifest, service worker, icons
```

Note: the project is intentionally flat — there is no `src/` directory.


## Setup (about 15 minutes)

### 1. Create a Supabase project
- Sign up at supabase.com (free), create a new project.
- When it's ready, open **SQL Editor**, paste the contents of
  `schema.sql`, and click **Run**. That creates the `rooms`, `players`,
  and `votes` tables, turns on realtime for them, and sets permissive
  policies for launch.

### 2. Get your keys
- Supabase → **Project Settings → API Keys**. Copy the **Project URL** and the
  **publishable** key.
- Copy `env.example` to `.env.local` and paste them in:
  ```
  VITE_SUPABASE_URL=https://yourproject.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
  ```
  The variable must be named `VITE_SUPABASE_PUBLISHABLE_KEY` — that is what
  `supabase.js` reads. An older `VITE_SUPABASE_ANON_KEY` will be ignored and the
  app will load blank with a console warning.

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
- Before deploying, add three environment variables under the project's
  **Environment Variables**:
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` — sent to the browser
  - `GOOGLE_PLACES_KEY` — **server-side only.** Do not give it a `VITE_` prefix;
    that would inline it into the public bundle. The `api/` routes read it.
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

## Live restaurant data

This is already built. `api/restaurants.js` is a Vercel serverless function that
calls the Google Places API with `GOOGLE_PLACES_KEY` kept server-side, dedupes
results, sorts them by distance, and returns at most 120. `api/place.js` fetches
richer detail (reviews, hours, phone) for a single place when someone taps
"More info". `useRestaurants.js` consumes both.

`restaurants.js` still ships a static fallback list near Ingalls, IN, and exports
`CUISINE_OPTIONS`, `DATA`, `DEFAULT_TIERS`, and `pickN`, which the UI imports.

**Cost note:** one `/api/restaurants` call without a `cuisines` filter issues
three billed Google Places calls; with a filter it issues one per cuisine, capped
at six. Both routes are public and unauthenticated, so set a billing cap and a
daily quota limit in Google Cloud Console, and add rate limiting before promoting
the app anywhere.

## Before a wider launch

The row-level-security policies in `schema.sql` are intentionally open so you can
ship fast — anyone with the anon key can read/write any room. That's fine for
friends and family. Before promoting it publicly, scope writes to a room's own
players (via a device header check or Supabase Auth) and add basic rate limiting.
```
```
