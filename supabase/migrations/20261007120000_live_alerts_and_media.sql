-- Live alerts: web push subscriptions for "Notify me when we go live".
-- Phones subscribe through save/remove functions; only the site's server (holding
-- PUSH_SECRET, whose sha256 lives in private.push_config) can read them to send.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.push_config (
  id int primary key default 1 check (id = 1),
  secret_hash text not null
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "admins read push subscriptions" on public.push_subscriptions
  for select using (public.is_admin());

-- One row per alert actually sent, so the same alert never goes out twice.
create table if not exists public.push_sends (
  key text primary key,
  title text not null,
  body text not null,
  sent int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.push_sends enable row level security;

create policy "admins read push sends" on public.push_sends
  for select using (public.is_admin());

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language sql security definer set search_path = public as $$
  insert into public.push_subscriptions (endpoint, p256dh, auth)
  values (p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth;
$$;

create or replace function public.remove_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;

create or replace function private.push_secret_ok(p_secret text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (
    select 1 from private.push_config
    where secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  );
$$;

create or replace function public.push_targets(p_secret text)
returns table (endpoint text, p256dh text, auth text)
language plpgsql security definer set search_path = public as $$
begin
  if not private.push_secret_ok(p_secret) then
    raise exception 'not allowed';
  end if;
  return query select s.endpoint, s.p256dh, s.auth from public.push_subscriptions s;
end $$;

-- Claims an alert key; false if that alert was already sent.
create or replace function public.claim_push_send(p_secret text, p_key text, p_title text, p_body text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not private.push_secret_ok(p_secret) then
    raise exception 'not allowed';
  end if;
  insert into public.push_sends (key, title, body) values (p_key, p_title, p_body)
  on conflict (key) do nothing;
  return found;
end $$;

create or replace function public.finish_push_send(p_secret text, p_key text, p_sent int, p_gone text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.push_secret_ok(p_secret) then
    raise exception 'not allowed';
  end if;
  update public.push_sends set sent = p_sent where key = p_key;
end $$;
-- Dead endpoints (404/410 from the push service) are removed by the server
-- through remove_push_subscription.

revoke all on function public.push_targets(text) from public;
revoke all on function public.claim_push_send(text, text, text, text) from public;
revoke all on function public.finish_push_send(text, text, int, text[]) from public;
grant execute on function public.push_targets(text) to anon, authenticated;
grant execute on function public.claim_push_send(text, text, text, text) to anon, authenticated;
grant execute on function public.finish_push_send(text, text, int, text[]) to anon, authenticated;

-- The secret's hash is set separately: insert into private.push_config (secret_hash) values ('<sha256 of PUSH_SECRET>').

-- Schedule (pg_cron + pg_net): ping the site 5 minutes before each service,
-- 10:55 PM and 6:55 AM Lagos time (21:55 and 05:55 UTC). The endpoint only
-- sends inside that window and only once per service per day.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('night-watch-alert', '55 21 * * *', $$select net.http_post(url := 'https://city-builders-church.vercel.app/api/push/cron', body := '{}'::jsonb)$$);
select cron.schedule('morning-prayers-alert', '55 5 * * *', $$select net.http_post(url := 'https://city-builders-church.vercel.app/api/push/cron', body := '{}'::jsonb)$$);

-- Media library: images uploaded from the admin (blog covers, sermon and event images).
-- Public to read; only admins and authors can upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "staff upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "staff update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());

-- Brand images the admin can change (Settings > Logo and photos).
alter table public.site_settings
  add column if not exists logo_url text,
  add column if not exists pastor_image_url text;

-- Storage meter for the admin Settings page.
create or replace function public.media_usage()
returns table (bytes bigint, files bigint)
language sql security definer set search_path = public, storage as $$
  select coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint, count(*)::bigint
  from storage.objects o
  where o.bucket_id = 'media' and public.is_admin();
$$;
