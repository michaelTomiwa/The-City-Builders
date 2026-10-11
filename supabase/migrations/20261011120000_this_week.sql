-- "This Week": a weekly checklist. The pastor sets items for everyone, a team
-- or chosen people (once, or repeating every week); members add their own
-- private items, and tick them off through the week. Weeks start on Monday
-- (Lagos time).

create table public.week_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 300),
  details text check (length(details) <= 2000),
  owner_id uuid references public.profiles(id) on delete cascade, -- set: a member's private item
  audience text not null default 'everyone' check (audience in ('everyone', 'team', 'selected')),
  team_id uuid references public.teams(id) on delete cascade,
  start_week date not null,
  repeats boolean not null default false,
  end_week date, -- a repeating item stops after this week
  sort int not null default 0,
  created_at timestamptz not null default now(),
  check (extract(isodow from start_week) = 1),
  check (audience <> 'team' or team_id is not null)
);
create index week_items_start_idx on public.week_items (start_week);

create table public.week_item_members (
  item_id uuid not null references public.week_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (item_id, user_id)
);

create table public.week_ticks (
  item_id uuid not null references public.week_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  week_start date not null,
  note text check (length(note) <= 500),
  created_at timestamptz not null default now(),
  primary key (item_id, user_id, week_start)
);
create index week_ticks_user_idx on public.week_ticks (user_id, week_start);

-- Is this item meant for this person (ignoring which week)?
create or replace function public.week_item_for(p_item public.week_items, p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when p_item.owner_id is not null then p_item.owner_id = p_user
    when p_item.audience = 'everyone' then true
    when p_item.audience = 'team' then exists (select 1 from public.team_members tm where tm.team_id = p_item.team_id and tm.user_id = p_user)
    else exists (select 1 from public.week_item_members m where m.item_id = p_item.id and m.user_id = p_user)
  end;
$$;

-- Does this item apply in this week?
create or replace function public.week_item_in(p_item public.week_items, p_week date) returns boolean
language sql immutable as $$
  select p_item.start_week <= p_week
    and case when p_item.repeats then p_item.end_week is null or p_item.end_week >= p_week else p_item.start_week = p_week end;
$$;

alter table public.week_items enable row level security;
alter table public.week_item_members enable row level security;
alter table public.week_ticks enable row level security;

create policy "see my week items" on public.week_items for select
  using (owner_id = auth.uid() or (owner_id is null and (is_admin() or (is_member() and public.week_item_for(week_items, auth.uid())))));
create policy "staff manage week items" on public.week_items for all
  using (owner_id is null and is_admin()) with check (owner_id is null and is_admin());
create policy "members add own items" on public.week_items for insert
  with check (owner_id = auth.uid() and is_member() and audience = 'everyone' and not repeats);
create policy "members remove own items" on public.week_items for delete using (owner_id = auth.uid());

create policy "staff manage item people" on public.week_item_members for all using (is_admin()) with check (is_admin());
create policy "see own item membership" on public.week_item_members for select using (user_id = auth.uid());

create policy "see own ticks" on public.week_ticks for select using (user_id = auth.uid() or is_admin());
create policy "tick own" on public.week_ticks for insert
  with check (user_id = auth.uid() and is_member() and exists (select 1 from public.week_items i where i.id = item_id and public.week_item_for(i, auth.uid()) and public.week_item_in(i, week_start)));
create policy "edit own tick" on public.week_ticks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "untick own" on public.week_ticks for delete using (user_id = auth.uid());

-- Team leads see how their people are doing this week (the pastor's items only).
create or replace function public.team_week_progress(p_team uuid, p_week date)
returns table(user_id uuid, done int, total int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not (is_admin() or leads_team(p_team)) then
    return;
  end if;
  return query
  select tm.user_id,
    (select count(*) from public.week_items i join public.week_ticks t on t.item_id = i.id and t.user_id = tm.user_id and t.week_start = p_week
      where i.owner_id is null and public.week_item_in(i, p_week) and public.week_item_for(i, tm.user_id))::int,
    (select count(*) from public.week_items i where i.owner_id is null and public.week_item_in(i, p_week) and public.week_item_for(i, tm.user_id))::int
  from public.team_members tm where tm.team_id = p_team;
end $$;
grant execute on function public.team_week_progress(uuid, date) to authenticated;

-- Phones to remind about the week (Monday: here's your week; Friday: what's left).
create or replace function public.week_reminder_targets(p_secret text, p_week date)
returns table(user_id uuid, first text, done int, total int, endpoint text, p256dh text, auth text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not private.push_secret_ok(p_secret) then
    raise exception 'not allowed';
  end if;
  return query
  with people as (
    select p.id, coalesce(nullif(split_part(trim(p.full_name), ' ', 1), ''), 'friend') as first,
      (select count(*) from public.week_items i join public.week_ticks t on t.item_id = i.id and t.user_id = p.id and t.week_start = p_week
        where public.week_item_in(i, p_week) and public.week_item_for(i, p.id))::int as done,
      (select count(*) from public.week_items i where public.week_item_in(i, p_week) and public.week_item_for(i, p.id))::int as total
    from public.profiles p where p.role = 'member' and p.status = 'active'
  )
  select x.id, x.first, x.done, x.total, ps.endpoint, ps.p256dh, ps.auth
  from people x join public.push_subscriptions ps on ps.user_id = x.id
  where x.total > 0;
end $$;
