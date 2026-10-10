-- Assignment accountability: reminders before the due date, a reason for
-- late hand-ins, a gentle ladder that follows people up when they miss,
-- restoration plans with a way back, and faithfulness for each member.

-- 1. Grace period and late hand-ins -------------------------------------------------

alter table public.assignments add column if not exists grace_hours int not null default 48 check (grace_hours between 0 and 720);

alter table public.submissions
  add column if not exists late boolean not null default false,
  add column if not exists late_reason text check (late_reason in ('sick', 'work', 'family', 'forgot', 'hard', 'struggling', 'other')),
  add column if not exists late_note text check (length(late_note) <= 2000);

-- Late is decided by the database when someone first hands in (the site asks
-- for a reason before a late hand-in). Handing in again later keeps the first answer.
create or replace function public.stamp_submission_late() returns trigger
language plpgsql security definer set search_path = public as $$
declare due timestamptz;
begin
  if tg_op = 'UPDATE' then
    new.late := old.late;
    new.late_reason := coalesce(new.late_reason, old.late_reason);
    new.late_note := coalesce(new.late_note, old.late_note);
    return new;
  end if;
  -- An upsert of an existing hand-in runs this before turning into an update.
  if exists (select 1 from public.submissions s where s.assignment_id = new.assignment_id and s.user_id = new.user_id) then
    return new;
  end if;
  select a.due_at into due from public.assignments a where a.id = new.assignment_id;
  new.late := due is not null and now() > due;
  if not new.late then
    new.late_reason := null;
    new.late_note := null;
  end if;
  return new;
end $$;
create trigger stamp_submission_late before insert or update on public.submissions for each row execute function public.stamp_submission_late();

-- 2. Restoration plans and the log of follow-ups ---------------------------------

create table public.restoration_plans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (length(plan) between 1 and 4000),
  due_on date,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  author_name text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index restoration_plans_member_idx on public.restoration_plans (member_id, created_at desc);
alter table public.restoration_plans enable row level security;
create policy "own or staff read plans" on public.restoration_plans for select using (member_id = auth.uid() or is_admin());
create policy "staff manage plans" on public.restoration_plans for all using (is_admin()) with check (is_admin());

-- What the system has already done, so each follow-up happens once.
create table public.accountability_actions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  ref text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);
alter table public.accountability_actions enable row level security;
create policy "staff read actions" on public.accountability_actions for select using (is_admin());

-- Messages written by the system on the pastor's behalf keep the sender they were given.
create or replace function public.stamp_direct_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now();
  if coalesce(current_setting('app.system_message', true), '') = 'on' then
    return new;
  end if;
  new.author_id := auth.uid();
  new.from_pastor := is_admin() and new.member_id <> auth.uid();
  select coalesce(nullif(trim(full_name), ''), split_part(email, '@', 1)) into new.author_name from public.profiles where id = auth.uid();
  return new;
end $$;

-- 3. The ladder ------------------------------------------------------------------
-- For each approved member, their last four finished assignments (handed in, or
-- past the due date and grace period): how many were missed, late or on time.
-- 0 on track, 1 gentle nudge, 2 check-in, 3 pastor's conversation, 4 restoration plan.
-- Staff (or the server with PUSH_SECRET) see everyone; a member sees only themself.

create or replace function public.accountability_ladder(p_secret text default null)
returns table(user_id uuid, level int, recent int, missed int, late int, on_time int, missed_in_row int, on_time_streak int, all_done int, all_on_time int, last_missed text, plan_id uuid)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare everyone boolean := is_admin() or (p_secret is not null and private.push_secret_ok(p_secret));
begin
  return query
  with members as (
    select p.id, p.created_at from public.profiles p
    where p.role = 'member' and p.status = 'active' and (everyone or p.id = auth.uid())
  ),
  fresh as (
    select rp.member_id, max(rp.completed_at) as since from public.restoration_plans rp where rp.status = 'completed' group by rp.member_id
  ),
  items as (
    select m.id as uid, a.title, a.due_at,
      case when s.id is null then 'missed' when s.late then 'late' else 'on_time' end as outcome
    from members m
    join public.assignments a on a.status = 'published' and a.due_at is not null and a.due_at > m.created_at
      and (a.audience = 'everyone' or exists (select 1 from public.assignment_members am where am.assignment_id = a.id and am.user_id = m.id))
    left join public.submissions s on s.assignment_id = a.id and s.user_id = m.id
    left join fresh f on f.member_id = m.id
    where (s.id is not null or a.due_at + make_interval(hours => a.grace_hours) < now())
      and (f.since is null or a.due_at > f.since)
  ),
  ranked as (select i.*, row_number() over (partition by i.uid order by i.due_at desc) as rn from items i),
  recent4 as (
    select r.uid, count(*) as n,
      count(*) filter (where r.outcome = 'missed') as missed,
      count(*) filter (where r.outcome = 'late') as late,
      count(*) filter (where r.outcome = 'on_time') as on_time,
      (array_agg(r.title order by r.due_at desc) filter (where r.outcome = 'missed'))[1] as last_missed
    from ranked r where r.rn <= 4 group by r.uid
  ),
  runs as (
    select r.uid,
      coalesce(min(r.rn) filter (where r.outcome <> 'missed'), max(r.rn) + 1) - 1 as missed_in_row,
      coalesce(min(r.rn) filter (where r.outcome <> 'on_time'), max(r.rn) + 1) - 1 as on_time_streak,
      count(*) as all_done,
      count(*) filter (where r.outcome = 'on_time') as all_on_time
    from ranked r group by r.uid
  ),
  plans as (
    select distinct on (rp.member_id) rp.member_id, rp.id from public.restoration_plans rp where rp.status = 'active' order by rp.member_id, rp.created_at desc
  )
  select m.id,
    case when pl.id is not null then 4 when coalesce(r.missed, 0) >= 3 then 3 when r.missed = 2 then 2 when r.missed = 1 then 1 else 0 end,
    coalesce(r.n, 0)::int, coalesce(r.missed, 0)::int, coalesce(r.late, 0)::int, coalesce(r.on_time, 0)::int,
    coalesce(u.missed_in_row, 0)::int, coalesce(u.on_time_streak, 0)::int, coalesce(u.all_done, 0)::int, coalesce(u.all_on_time, 0)::int,
    r.last_missed, pl.id
  from members m
  left join recent4 r on r.uid = m.id
  left join runs u on u.uid = m.id
  left join plans pl on pl.member_id = m.id;
end $$;
grant execute on function public.accountability_ladder(text) to anon, authenticated;

-- 4. Reminders 24 hours and 3 hours before an assignment is due -----------------

create or replace function public.assignment_reminder_targets(p_secret text)
returns table(kind text, assignment_id uuid, title text, due_at timestamptz, user_id uuid, endpoint text, p256dh text, auth text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not private.push_secret_ok(p_secret) then
    raise exception 'not allowed';
  end if;
  return query
  select case when a.due_at < now() + interval '6 hours' then '3h' else '24h' end, a.id, a.title, a.due_at, m.id, ps.endpoint, ps.p256dh, ps.auth
  from public.assignments a
  join public.profiles m on m.role = 'member' and m.status = 'active'
    and (a.audience = 'everyone' or exists (select 1 from public.assignment_members am where am.assignment_id = a.id and am.user_id = m.id))
  join public.push_subscriptions ps on ps.user_id = m.id
  where a.status = 'published' and a.due_at is not null
    and (a.due_at between now() + interval '2 hours' and now() + interval '4 hours'
      or a.due_at between now() + interval '23 hours' and now() + interval '25 hours')
    and not exists (select 1 from public.submissions s where s.assignment_id = a.id and s.user_id = m.id);
end $$;

-- 5. The hourly follow-up -------------------------------------------------------
-- New misses get a gentle message from the pastor. Someone at "check-in" has
-- their team lead (or prayer partner) asked to reach out, once a week. Someone
-- at "pastor's conversation" is flagged Follow up in the pastor's Messages.
-- Returns the phone alerts to send; a null user means "all staff".

create or replace function public.run_accountability(p_secret text)
returns table(push_user uuid, push_title text, push_body text, push_url text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  r record;
  helper record;
  wk text := to_char(now() at time zone 'Africa/Lagos', 'IYYY-IW');
begin
  if not private.push_secret_ok(p_secret) then
    raise exception 'not allowed';
  end if;
  perform set_config('app.system_message', 'on', true);

  -- Gentle nudge for each miss in the last 48 hours (older ones were before this started).
  for r in
    select m.id as uid, coalesce(nullif(split_part(trim(m.full_name), ' ', 1), ''), 'friend') as first, a.id as aid, a.title
    from public.profiles m
    join public.assignments a on a.status = 'published' and a.due_at is not null and a.due_at > m.created_at
      and (a.audience = 'everyone' or exists (select 1 from public.assignment_members am where am.assignment_id = a.id and am.user_id = m.id))
    where m.role = 'member' and m.status = 'active'
      and a.due_at + make_interval(hours => a.grace_hours) between now() - interval '48 hours' and now()
      and not exists (select 1 from public.submissions s where s.assignment_id = a.id and s.user_id = m.id)
      and not exists (select 1 from public.accountability_actions x where x.user_id = m.id and x.kind = 'nudge' and x.ref = a.id::text)
  loop
    insert into public.accountability_actions (user_id, kind, ref) values (r.uid, 'nudge', r.aid::text);
    insert into public.direct_messages (member_id, from_pastor, author_name, body)
    values (r.uid, true, 'Pastor Michael', format(
      'Hi %s, we missed your assignment "%s". Is everything okay? You can still hand it in under Assignments, and tell me what happened. I''m praying for you. — Pastor Michael',
      r.first, r.title));
    push_user := r.uid; push_title := 'Pastor Michael'; push_body := format('We missed your assignment "%s". Is everything okay?', r.title); push_url := '/me/messages';
    return next;
  end loop;

  for r in
    select l.user_id as uid, l.level, l.missed, coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)) as name
    from public.accountability_ladder(p_secret) l join public.profiles p on p.id = l.user_id
    where l.level in (2, 3)
  loop
    -- Check-in: their team lead, or else their prayer partner, is asked to reach out.
    if not exists (select 1 from public.accountability_actions x where x.user_id = r.uid and x.kind = 'checkin' and x.ref = wk) then
      select tm2.user_id as id, coalesce(nullif(split_part(trim(lp.full_name), ' ', 1), ''), 'friend') as first, true as is_lead into helper
      from public.team_members tm
      join public.team_members tm2 on tm2.team_id = tm.team_id and tm2.role in ('lead', 'assistant') and tm2.user_id <> r.uid
      join public.profiles lp on lp.id = tm2.user_id
      where tm.user_id = r.uid
      order by (tm2.role = 'lead') desc
      limit 1;
      if helper.id is null then
        select pp.other as id, coalesce(nullif(split_part(trim(pr.full_name), ' ', 1), ''), 'friend') as first, false as is_lead into helper
        from (select case when x.user_a = r.uid then x.user_b else x.user_a end as other from public.prayer_partners x where r.uid in (x.user_a, x.user_b) limit 1) pp
        join public.profiles pr on pr.id = pp.other;
      end if;
      insert into public.accountability_actions (user_id, kind, ref) values (r.uid, 'checkin', wk);
      if helper.id is not null then
        insert into public.direct_messages (member_id, from_pastor, author_name, body)
        values (helper.id, true, 'Pastor Michael', case when helper.is_lead then format(
          'Hi %s, please check in with %s this week. They''ve missed %s of their last 4 assignments. A call or a visit, a prayer together, and let me know how they are. Thank you for shepherding your team. — Pastor Michael',
          helper.first, r.name, r.missed)
        else format(
          'Hi %s, please pray for %s this week and check in on them. A call or a message from you can mean a lot. Thank you. — Pastor Michael',
          helper.first, r.name) end);
        push_user := helper.id; push_title := 'Pastor Michael'; push_body := format('Please check in with %s this week.', r.name); push_url := '/me/messages';
        return next;
      end if;
    end if;

    -- Pastor's conversation: flagged in the pastor's Messages, once a week.
    if r.level = 3 and not exists (select 1 from public.accountability_actions x where x.user_id = r.uid and x.kind = 'pastor' and x.ref = wk) then
      insert into public.accountability_actions (user_id, kind, ref) values (r.uid, 'pastor', wk);
      insert into public.conversations as c (member_id, follow_up) values (r.uid, true)
      on conflict (member_id) do update set follow_up = true;
      push_user := null; push_title := 'Needs a pastor''s conversation';
      push_body := format('%s has missed %s of their last 4 assignments.', r.name, r.missed); push_url := '/admin/accountability';
      return next;
    end if;
  end loop;
end $$;

-- Every hour, at 10 past.
select cron.schedule('assignment-care', '10 * * * *',
  $$select net.http_post(url := 'https://city-builders-church.vercel.app/api/push/assignments', body := '{}'::jsonb)$$);
