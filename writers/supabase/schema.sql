-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- Commission / contact requests from the "Start a project" form.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  script_type text check (char_length(script_type) <= 80),
  budget text check (char_length(budget) <= 80),
  message text not null check (char_length(message) between 1 and 5000)
);

-- Reviews from past clients. New ones arrive unapproved; flip `approved`
-- to true in the Table Editor to publish one on the site.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  role text check (char_length(role) <= 120),
  project text check (char_length(project) <= 160),
  quote text not null check (char_length(quote) between 10 and 1500),
  rating smallint not null default 5 check (rating between 1 and 5),
  approved boolean not null default false
);

alter table public.inquiries enable row level security;
alter table public.reviews enable row level security;

-- Visitors may send an inquiry but never read any back.
drop policy if exists "anyone can send an inquiry" on public.inquiries;
create policy "anyone can send an inquiry" on public.inquiries
  for insert to anon, authenticated with check (true);

-- Visitors may submit a review, but only as unapproved.
drop policy if exists "anyone can submit a review" on public.reviews;
create policy "anyone can submit a review" on public.reviews
  for insert to anon, authenticated with check (approved = false);

-- Only approved reviews are readable.
drop policy if exists "approved reviews are public" on public.reviews;
create policy "approved reviews are public" on public.reviews
  for select to anon, authenticated using (approved = true);
