-- Next Stop — multiplayer schema
-- Run this in your Supabase project: SQL Editor → paste → Run.

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists rooms (
  code        text primary key,                -- e.g. "NEXT-7Q2X"
  host_id     text not null,                   -- device id of the host
  status      text not null default 'lobby',   -- 'lobby' | 'voting' | 'revealed'
  candidates  jsonb not null default '[]',     -- array of restaurant objects (the 3 picks)
  winner      jsonb,                            -- the chosen restaurant object
  created_at  timestamptz not null default now()
);

create table if not exists players (
  room_code  text not null references rooms(code) on delete cascade,
  device_id  text not null,
  name       text not null,
  is_host    boolean not null default false,
  joined_at  timestamptz not null default now(),
  primary key (room_code, device_id)
);

create table if not exists votes (
  room_code  text not null references rooms(code) on delete cascade,
  device_id  text not null,
  choice     text not null,                    -- restaurant name the device voted for
  updated_at timestamptz not null default now(),
  primary key (room_code, device_id)           -- one vote per device; changing vote upserts
);

create index if not exists players_room_idx on players(room_code);
create index if not exists votes_room_idx on votes(room_code);

-- ─────────────────────────────────────────────────────────────
-- Realtime: let clients subscribe to changes on these tables
-- ─────────────────────────────────────────────────────────────

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table votes;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- NOTE: these policies are permissive for a friends-and-family MVP —
-- anyone with your anon key can read/write any room. That's fine for
-- launch, but before wider release you'd scope writes to the room's
-- own players (e.g. check device_id via a header or Supabase Auth).
-- ─────────────────────────────────────────────────────────────

alter table rooms   enable row level security;
alter table players enable row level security;
alter table votes   enable row level security;

create policy "rooms open"   on rooms   for all using (true) with check (true);
create policy "players open" on players for all using (true) with check (true);
create policy "votes open"   on votes   for all using (true) with check (true);
