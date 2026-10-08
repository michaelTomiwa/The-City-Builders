-- Pastor ↔ member messages: one private conversation per member with the
-- pastor's office (any admin or author), live through Realtime, with photo
-- attachments in a private bucket, messages sent to many people at once,
-- and saved quick replies.

create table public.conversations (
  member_id uuid primary key references public.profiles(id) on delete cascade,
  last_body text,
  last_at timestamptz,
  last_from_pastor boolean,
  member_unread int not null default 0,
  pastor_unread int not null default 0,
  member_read_at timestamptz,
  pastor_read_at timestamptz,
  pinned boolean not null default false,
  follow_up boolean not null default false
);

create table public.message_broadcasts (
  id uuid primary key default gen_random_uuid(),
  audience text not null,
  body text not null,
  sent_count int not null default 0,
  author_name text,
  created_at timestamptz not null default now()
);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  from_pastor boolean not null default false,
  author_id uuid references public.profiles(id) on delete set null default auth.uid(),
  author_name text,
  body text,
  image_path text,
  broadcast_id uuid references public.message_broadcasts(id) on delete set null,
  created_at timestamptz not null default now(),
  check (coalesce(length(trim(body)), 0) > 0 or image_path is not null),
  check (length(body) <= 4000)
);
create index direct_messages_member_idx on public.direct_messages (member_id, created_at desc);

create table public.quick_replies (
  id uuid primary key default gen_random_uuid(),
  body text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.direct_messages enable row level security;
alter table public.message_broadcasts enable row level security;
alter table public.quick_replies enable row level security;

create policy "own or staff read conversations" on public.conversations for select using (member_id = auth.uid() or is_admin());
create policy "staff update conversations" on public.conversations for update using (is_admin()) with check (is_admin());

create policy "own or staff read messages" on public.direct_messages for select using (member_id = auth.uid() or is_admin());
create policy "members write in own conversation, staff anywhere" on public.direct_messages for insert
  with check ((member_id = auth.uid() and is_member()) or is_admin());
create policy "staff delete messages" on public.direct_messages for delete using (is_admin());

create policy "staff broadcasts" on public.message_broadcasts for all using (is_admin()) with check (is_admin());
create policy "staff quick replies" on public.quick_replies for all using (is_admin()) with check (is_admin());

-- Who sent it is decided by the database, never by the browser.
create or replace function public.stamp_direct_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.author_id := auth.uid();
  new.from_pastor := is_admin() and new.member_id <> auth.uid();
  select coalesce(nullif(trim(full_name), ''), split_part(email, '@', 1)) into new.author_name from public.profiles where id = auth.uid();
  new.created_at := now();
  return new;
end $$;
create trigger stamp_direct_message before insert on public.direct_messages for each row execute function public.stamp_direct_message();

-- Keeps the inbox row (last message, unread counts) up to date.
create or replace function public.bump_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.conversations as c (member_id, last_body, last_at, last_from_pastor, member_unread, pastor_unread)
  values (new.member_id, coalesce(nullif(trim(new.body), ''), '📷 Photo'), new.created_at, new.from_pastor,
          case when new.from_pastor then 1 else 0 end, case when new.from_pastor then 0 else 1 end)
  on conflict (member_id) do update set
    last_body = excluded.last_body,
    last_at = excluded.last_at,
    last_from_pastor = excluded.last_from_pastor,
    member_unread = c.member_unread + excluded.member_unread,
    pastor_unread = c.pastor_unread + excluded.pastor_unread;
  return new;
end $$;
create trigger bump_conversation after insert on public.direct_messages for each row execute function public.bump_conversation();

-- "Seen": the member marks the pastor's messages read, or staff mark the member's.
create or replace function public.mark_conversation_read(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_member = auth.uid() then
    update public.conversations set member_unread = 0, member_read_at = now() where member_id = p_member;
  elsif is_admin() then
    update public.conversations set pastor_unread = 0, pastor_read_at = now() where member_id = p_member;
  end if;
end $$;
revoke execute on function public.mark_conversation_read(uuid) from anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Phones to alert for a new message, read with PUSH_SECRET on the server.
create or replace function public.user_push_targets(p_secret text, p_users uuid[])
returns table(user_id uuid, endpoint text, p256dh text, auth text)
language plpgsql security definer set search_path = public as $$
begin
  if not private.push_secret_ok(p_secret) then
    raise exception 'not allowed';
  end if;
  return query select ps.user_id, ps.endpoint, ps.p256dh, ps.auth from public.push_subscriptions ps where ps.user_id = any(p_users);
end $$;

-- Live updates
alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.conversations;

-- Photos sent in messages: private, in a folder per member.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat', 'chat', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "chat photos upload" on storage.objects for insert
  with check (bucket_id = 'chat' and (((storage.foldername(name))[1] = auth.uid()::text and is_member()) or is_admin()));
create policy "chat photos read" on storage.objects for select
  using (bucket_id = 'chat' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
