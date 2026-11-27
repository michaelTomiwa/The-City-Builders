-- Wedding pages hosted by the church (e.g. /wedding/olalekan-and-christiana):
-- guests RSVP and leave wishes for the couple. Anyone can send; only admins
-- can read RSVPs. Wishes show on the page unless an admin hides one.

create table if not exists public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  wedding text not null check (char_length(wedding) between 1 and 80),
  name text not null check (char_length(name) between 1 and 120),
  phone text check (char_length(phone) <= 40),
  attending boolean not null,
  guests integer not null default 1 check (guests between 0 and 10),
  events text[] not null default '{}' check (cardinality(events) <= 6),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists wedding_rsvps_wedding_idx on public.wedding_rsvps (wedding, created_at desc);
alter table public.wedding_rsvps enable row level security;

create policy "guests send rsvps" on public.wedding_rsvps
  for insert to anon, authenticated with check (true);
create policy "admins manage rsvps" on public.wedding_rsvps
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.wedding_wishes (
  id uuid primary key default gen_random_uuid(),
  wedding text not null check (char_length(wedding) between 1 and 80),
  name text not null check (char_length(name) between 1 and 120),
  message text not null check (char_length(message) between 1 and 600),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists wedding_wishes_wedding_idx on public.wedding_wishes (wedding, created_at desc);
alter table public.wedding_wishes enable row level security;

create policy "guests send wishes" on public.wedding_wishes
  for insert to anon, authenticated with check (hidden = false);
create policy "everyone reads shown wishes" on public.wedding_wishes
  for select using (hidden = false);
create policy "admins manage wishes" on public.wedding_wishes
  for all using (public.is_admin()) with check (public.is_admin());
