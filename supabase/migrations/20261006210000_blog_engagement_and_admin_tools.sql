-- Blog engagement (reads, likes, tags, featured, scheduling, comments),
-- prayer inbox, giving links, site settings and subscribers for the admin.
-- Purely additive: no existing column or row is removed.
-- Applied to the live project on 2026-10-06 in small steps (same statements).

-- Posts ---------------------------------------------------------------
alter table public.posts
  add column if not exists views integer not null default 0,
  add column if not exists likes integer not null default 0,
  add column if not exists tags text[] not null default '{}',
  add column if not exists featured boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- Scheduled posts stay hidden until their publish time.
alter policy "public read published posts" on public.posts
  using (published = true and (published_at is null or published_at <= now()));

create or replace function public.increment_post_view(post_slug text)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.posts
     set views = views + 1
   where slug = post_slug
     and published = true
     and (published_at is null or published_at <= now())
  returning views;
$$;

create or replace function public.like_post(post_slug text)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.posts
     set likes = likes + 1
   where slug = post_slug
     and published = true
     and (published_at is null or published_at <= now())
  returning likes;
$$;

grant execute on function public.increment_post_view(text) to anon, authenticated;
grant execute on function public.like_post(text) to anon, authenticated;

-- Comments (held for approval) ------------------------------------------
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_id_created_at_idx
  on public.post_comments (post_id, created_at);

alter table public.post_comments enable row level security;

create policy "public read approved comments" on public.post_comments
  for select using (approved = true);

create policy "anyone can comment on a live post" on public.post_comments
  for insert with check (
    approved = false
    and exists (
      select 1 from public.posts p
       where p.id = post_id
         and p.published = true
         and (p.published_at is null or p.published_at <= now())
    )
  );

create policy "admins manage comments" on public.post_comments
  for all using (public.is_admin()) with check (public.is_admin());

-- Prayer inbox --------------------------------------------------------------
alter table public.prayer_requests
  add column if not exists status text not null default 'new'
    check (status in ('new', 'prayed', 'answered'));

create policy "admins manage prayers" on public.prayer_requests
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.pray_for(request_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.prayer_requests
     set prayed_count = prayed_count + 1
   where id = request_id and is_public = true
  returning prayed_count;
$$;

grant execute on function public.pray_for(uuid) to anon, authenticated;

-- Giving links ---------------------------------------------------------------
create policy "admins manage giving links" on public.giving_links
  for all using (public.is_admin()) with check (public.is_admin());

-- Site settings (one row) -------------------------------------------------------
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  announcement text,
  announcement_link text,
  announcement_active boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "public read site settings" on public.site_settings
  for select using (true);

create policy "admins manage site settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Email subscribers ---------------------------------------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name text check (name is null or char_length(name) <= 80),
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

create policy "anyone can subscribe" on public.subscribers
  for insert with check (true);

create policy "admins manage subscribers" on public.subscribers
  for all using (public.is_admin()) with check (public.is_admin());
