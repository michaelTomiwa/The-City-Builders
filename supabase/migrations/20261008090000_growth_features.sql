-- Growth features: Discipleship School, Bible in a year, scripture memory,
-- service attendance, prayer partners, testimonies, pastoral care notes and
-- personal push reminders. (Applied to the project in small steps.)

-- Discipleship School ----------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  sort int not null default 0,
  title text not null,
  video_url text,
  body text,
  scripture text
);
create index on public.lessons (course_id, sort);
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  sort int not null default 0,
  question text not null,
  options text[] not null,
  answer int not null,
  explanation text
);
create index on public.quiz_questions (lesson_id, sort);
create table public.lesson_progress (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  score int,
  total int,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.lesson_progress enable row level security;
create policy "members see published courses" on public.courses for select using (public.is_admin() or (status = 'published' and public.is_member()));
create policy "admins manage courses" on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy "members see lessons" on public.lessons for select using (public.is_admin() or (public.is_member() and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')));
create policy "admins manage lessons" on public.lessons for all using (public.is_admin()) with check (public.is_admin());
-- Quiz answers are never readable by members; they use lesson_quiz() and complete_lesson().
create policy "admins manage quiz" on public.quiz_questions for all using (public.is_admin()) with check (public.is_admin());
create policy "see own lesson progress" on public.lesson_progress for select using (user_id = auth.uid() or public.is_admin());

create or replace function public.lesson_quiz(p_lesson uuid)
returns table (id uuid, sort int, question text, options text[])
language sql stable security definer set search_path = public as $$
  select q.id, q.sort, q.question, q.options
  from public.quiz_questions q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where q.lesson_id = p_lesson
    and (public.is_admin() or (public.is_member() and c.status = 'published'))
  order by q.sort;
$$;

create or replace function public.complete_lesson(p_lesson uuid, p_answers int[])
returns json language plpgsql security definer set search_path = public as $$
declare
  v_course uuid;
  v_total int;
  v_score int := 0;
  v_correct int[] := '{}';
  v_expl text[] := '{}';
  r record;
  i int := 1;
begin
  if not public.is_member() then
    raise exception 'not allowed';
  end if;
  select l.course_id into v_course from public.lessons l join public.courses c on c.id = l.course_id
    where l.id = p_lesson and (c.status = 'published' or public.is_admin());
  if v_course is null then
    raise exception 'lesson not found';
  end if;
  select count(*) into v_total from public.quiz_questions where lesson_id = p_lesson;
  for r in select answer, explanation from public.quiz_questions where lesson_id = p_lesson order by sort loop
    v_correct := v_correct || r.answer;
    v_expl := v_expl || coalesce(r.explanation, '');
    if p_answers is not null and array_length(p_answers, 1) >= i and p_answers[i] = r.answer then
      v_score := v_score + 1;
    end if;
    i := i + 1;
  end loop;
  if v_total = 0 or v_score * 10 >= v_total * 7 then
    insert into public.lesson_progress (user_id, lesson_id, course_id, score, total)
    values (auth.uid(), p_lesson, v_course, v_score, v_total)
    on conflict (user_id, lesson_id) do update set score = greatest(public.lesson_progress.score, excluded.score), total = excluded.total;
  end if;
  return json_build_object('score', v_score, 'total', v_total, 'passed', v_total = 0 or v_score * 10 >= v_total * 7, 'correct', v_correct, 'explanations', v_expl);
end $$;

-- Bible in a year and scripture memory ----------------------------------------------------
alter table public.profiles
  add column if not exists bible_plan_start date,
  add column if not exists daily_reminder boolean not null default true,
  add column if not exists prayer_need text;

create table public.bible_reading (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  day int not null check (day between 1 and 365),
  read_at timestamptz not null default now(),
  primary key (user_id, day)
);
create table public.verse_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  ref text not null,
  verse text,
  note text,
  color text not null default 'gold',
  created_at timestamptz not null default now()
);
create index on public.verse_notes (user_id, created_at);
create table public.memory_verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  ref text not null,
  text text not null,
  box int not null default 1 check (box between 1 and 6),
  due_on date not null default current_date,
  reviews int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, ref)
);
alter table public.bible_reading enable row level security;
alter table public.verse_notes enable row level security;
alter table public.memory_verses enable row level security;
create policy "own bible reading" on public.bible_reading for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member());
create policy "admins read bible reading" on public.bible_reading for select using (public.is_admin());
create policy "own verse notes" on public.verse_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member());
create policy "own memory verses" on public.memory_verses for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member());
create policy "admins read memory verses" on public.memory_verses for select using (public.is_admin());

-- Attendance, prayer partners, testimonies, care notes ----------------------------------------
create table public.attendance (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  service_id text not null check (service_id in ('night-watch', 'morning-prayers')),
  service_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, service_id, service_date)
);
alter table public.attendance enable row level security;
create policy "see own attendance" on public.attendance for select using (user_id = auth.uid() or public.is_admin());

create table public.prayer_partners (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a <> user_b)
);
alter table public.prayer_partners enable row level security;
create policy "see own partnership" on public.prayer_partners for select using (auth.uid() in (user_a, user_b) or public.is_admin());
create policy "admins manage partners" on public.prayer_partners for all using (public.is_admin()) with check (public.is_admin());

create table public.partner_prayers (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  partner_id uuid not null references public.profiles(id) on delete cascade,
  prayed_on date not null,
  primary key (user_id, partner_id, prayed_on)
);
alter table public.partner_prayers enable row level security;
create policy "see partner prayers" on public.partner_prayers for select using (auth.uid() in (user_id, partner_id) or public.is_admin());

create table public.testimonies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references public.profiles(id) on delete set null,
  display_name text,
  title text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.testimonies enable row level security;
create policy "everyone reads approved testimonies" on public.testimonies for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy "members share testimonies" on public.testimonies for insert with check (user_id = auth.uid() and status = 'pending' and public.is_member());
create policy "admins manage testimonies" on public.testimonies for all using (public.is_admin()) with check (public.is_admin());

create table public.care_notes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  tag text not null default 'note' check (tag in ('note', 'new-believer', 'struggling', 'needs-visit', 'celebrate', 'prayer')),
  body text not null,
  follow_up_on date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.care_notes (member_id, created_at);
alter table public.care_notes enable row level security;
create policy "admins manage care notes" on public.care_notes for all using (public.is_admin()) with check (public.is_admin());

-- "I'm here" only counts while a service is on (15 minutes' grace), Lagos time.
create or replace function public.mark_attendance()
returns json language plpgsql security definer set search_path = public as $$
declare
  lagos timestamp := now() at time zone 'Africa/Lagos';
  t time := lagos::time;
  v_service text;
  v_date date;
begin
  if not public.is_member() then
    raise exception 'not allowed';
  end if;
  if t >= time '22:45' then
    v_service := 'night-watch'; v_date := lagos::date;
  elsif t < time '01:15' then
    v_service := 'night-watch'; v_date := lagos::date - 1;
  elsif t >= time '06:45' and t < time '08:15' then
    v_service := 'morning-prayers'; v_date := lagos::date;
  else
    return json_build_object('ok', false);
  end if;
  insert into public.attendance (user_id, service_id, service_date)
  values (auth.uid(), v_service, v_date)
  on conflict do nothing;
  return json_build_object('ok', true, 'service', v_service, 'date', v_date);
end $$;

create or replace function public.my_partner()
returns table (partner_id uuid, full_name text, phone text, prayer_need text, prayed_for_me_today boolean, i_prayed_today boolean)
language sql stable security definer set search_path = public as $$
  with pair as (
    select case when p.user_a = auth.uid() then p.user_b else p.user_a end as pid
    from public.prayer_partners p
    where auth.uid() in (p.user_a, p.user_b)
    order by p.created_at desc
    limit 1
  ), today as (select (now() at time zone 'Africa/Lagos')::date as d)
  select pr.id, pr.full_name, pr.phone, pr.prayer_need,
    exists (select 1 from public.partner_prayers x, today where x.user_id = pr.id and x.partner_id = auth.uid() and x.prayed_on = today.d),
    exists (select 1 from public.partner_prayers x, today where x.user_id = auth.uid() and x.partner_id = pr.id and x.prayed_on = today.d)
  from pair join public.profiles pr on pr.id = pair.pid;
$$;

create or replace function public.pray_for_partner()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_partner uuid;
begin
  select partner_id into v_partner from public.my_partner();
  if v_partner is null then
    raise exception 'no partner';
  end if;
  insert into public.partner_prayers (user_id, partner_id, prayed_on)
  values (auth.uid(), v_partner, (now() at time zone 'Africa/Lagos')::date)
  on conflict do nothing;
end $$;

-- Personal reminders -------------------------------------------------------------------------
alter table public.push_subscriptions add column if not exists user_id uuid references public.profiles(id) on delete set null;

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language sql security definer set search_path = public as $$
  insert into public.push_subscriptions (endpoint, p256dh, auth, user_id)
  values (p_endpoint, p_p256dh, p_auth, auth.uid())
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth,
    user_id = coalesce(excluded.user_id, public.push_subscriptions.user_id);
$$;

create or replace function public.daily_digest(p_secret text)
returns table (endpoint text, p256dh text, auth text, user_id uuid, full_name text, today_count int, today_first text, missed_yesterday int)
language plpgsql security definer set search_path = public as $$
begin
  if not private.push_secret_ok(p_secret) then
    raise exception 'not allowed';
  end if;
  return query
  with d as (select (now() at time zone 'Africa/Lagos')::date as today),
  members as (
    select pr.id, pr.full_name from public.profiles pr
    where pr.daily_reminder and (pr.status = 'active' or pr.role in ('admin', 'author'))
  ),
  visible as (
    select m.id as uid, p.id as pid, p.start_date
    from members m join public.programs p on p.status = 'published'
    where p.audience = 'everyone' or exists (select 1 from public.program_members pm where pm.program_id = p.id and pm.user_id = m.id)
  ),
  steps as (
    select v.uid, s.id, s.title, s.sort, (v.start_date + s.day - 1) as on_date
    from visible v join public.program_steps s on s.program_id = v.pid
  )
  select ps.endpoint, ps.p256dh, ps.auth, m.id, m.full_name,
    (select count(*)::int from steps s, d where s.uid = m.id and s.on_date = d.today),
    (select s.title from steps s, d where s.uid = m.id and s.on_date = d.today order by s.sort limit 1),
    (select count(*)::int from steps s, d where s.uid = m.id and s.on_date = d.today - 1
       and not exists (select 1 from public.step_checkins c where c.step_id = s.id and c.user_id = m.id))
  from public.push_subscriptions ps join members m on m.id = ps.user_id;
end $$;

create or replace function public.staff_push_targets(p_secret text)
returns table (endpoint text, p256dh text, auth text)
language plpgsql security definer set search_path = public as $$
begin
  if not private.push_secret_ok(p_secret) then
    raise exception 'not allowed';
  end if;
  return query select ps.endpoint, ps.p256dh, ps.auth from public.push_subscriptions ps
    join public.profiles pr on pr.id = ps.user_id where pr.role in ('admin', 'author');
end $$;

revoke execute on function public.daily_digest(text) from public;
revoke execute on function public.staff_push_targets(text) from public;
grant execute on function public.daily_digest(text) to anon, authenticated;
grant execute on function public.staff_push_targets(text) to anon, authenticated;

-- 6:00 AM Lagos personal reminders; Monday 8:00 AM weekly report alert for staff.
select cron.schedule('daily-steps-reminder', '0 5 * * *', $$select net.http_post(url := 'https://city-builders-church.vercel.app/api/push/daily', body := '{}'::jsonb)$$);
select cron.schedule('weekly-pastor-report', '0 7 * * 1', $$select net.http_post(url := 'https://city-builders-church.vercel.app/api/push/weekly', body := '{}'::jsonb)$$);
