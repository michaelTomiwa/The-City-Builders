-- Teams (Priesthood, Worship, Media…): roles, tasks with accountability, reports
-- to the pastor, pastor–leader messages, team board and prayer, meetings, and
-- member invites. Applied to the project in small steps.

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  color text not null default '#f0b44c',
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('lead', 'assistant', 'member')),
  title text,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index on public.team_members (user_id);

create or replace function public.in_team(p_team uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.team_members where team_id = p_team and user_id = auth.uid()
  );
$$;

create or replace function public.leads_team(p_team uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.team_members where team_id = p_team and user_id = auth.uid() and role in ('lead', 'assistant')
  );
$$;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
create policy "members see teams" on public.teams for select using (public.is_member());
create policy "admins manage teams" on public.teams for all using (public.is_admin()) with check (public.is_admin());
create policy "see team roster" on public.team_members for select using (user_id = auth.uid() or public.in_team(team_id));
create policy "admins manage roster" on public.team_members for all using (public.is_admin()) with check (public.is_admin());

-- Tasks --------------------------------------------------------------------------------
create table public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  details text,
  due_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.team_tasks (team_id, created_at);

create table public.task_assignments (
  task_id uuid not null references public.team_tasks(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'todo' check (status in ('todo', 'done', 'approved', 'redo')),
  note text,
  proof_url text,
  feedback text,
  done_at timestamptz,
  reviewed_at timestamptz,
  primary key (task_id, user_id)
);
create index on public.task_assignments (user_id, status);

alter table public.team_tasks enable row level security;
alter table public.task_assignments enable row level security;
create policy "team sees tasks" on public.team_tasks for select using (public.in_team(team_id));
create policy "leads manage tasks" on public.team_tasks for all using (public.leads_team(team_id)) with check (public.leads_team(team_id));
create policy "see own or led assignments" on public.task_assignments for select using (user_id = auth.uid() or public.leads_team(team_id));
create policy "leads assign" on public.task_assignments for insert with check (public.leads_team(team_id));
create policy "leads remove assignments" on public.task_assignments for delete using (public.leads_team(team_id));
create policy "update own or led assignments" on public.task_assignments for update using (user_id = auth.uid() or public.leads_team(team_id)) with check (user_id = auth.uid() or public.leads_team(team_id));

create or replace function public.guard_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.leads_team(new.team_id) and new.user_id is distinct from auth.uid() then
    if new.status in ('approved', 'redo') and old.status is distinct from new.status then
      new.reviewed_at := now();
    end if;
    return new;
  end if;
  new.task_id := old.task_id;
  new.team_id := old.team_id;
  new.user_id := old.user_id;
  new.feedback := old.feedback;
  new.reviewed_at := old.reviewed_at;
  if new.status not in ('todo', 'done') then
    new.status := old.status;
  end if;
  if new.status = 'done' and old.status is distinct from 'done' then
    new.done_at := now();
  end if;
  return new;
end $$;
create trigger guard_assignment before update on public.task_assignments
  for each row execute function public.guard_assignment();

-- Reports and the pastor–leader conversation ---------------------------------------
create table public.team_reports (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  author_name text,
  week_of date not null default current_date,
  health int check (health between 1 and 5),
  god_doing text,
  growth text,
  wins text,
  concerns text,
  prayer text,
  pastor_reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.team_reports (team_id, created_at);
alter table public.team_reports enable row level security;
create policy "leaders see reports" on public.team_reports for select using (public.leads_team(team_id));
create policy "leaders write reports" on public.team_reports for insert with check (public.leads_team(team_id) and author_id = auth.uid());
create policy "author or pastor update reports" on public.team_reports for update using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());

create or replace function public.guard_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.pastor_reply := case when tg_op = 'UPDATE' then old.pastor_reply else null end;
    new.replied_at := case when tg_op = 'UPDATE' then old.replied_at else null end;
  end if;
  return new;
end $$;
create trigger guard_report before insert or update on public.team_reports
  for each row execute function public.guard_report();

create table public.team_messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  author_name text,
  from_pastor boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.team_messages (team_id, created_at);
alter table public.team_messages enable row level security;
create policy "leaders read messages" on public.team_messages for select using (public.leads_team(team_id));
create policy "leaders send messages" on public.team_messages for insert with check (public.leads_team(team_id) and author_id = auth.uid());

create or replace function public.stamp_team_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.from_pastor := public.is_admin();
  return new;
end $$;
create trigger stamp_team_message before insert on public.team_messages
  for each row execute function public.stamp_team_message();

-- Team board and prayer wall ------------------------------------------------------------
create table public.team_posts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  author_name text,
  kind text not null default 'update' check (kind in ('update', 'prayer')),
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.team_posts (team_id, created_at);
alter table public.team_posts enable row level security;
create policy "team reads posts" on public.team_posts for select using (public.in_team(team_id));
create policy "post to team" on public.team_posts for insert with check (
  author_id = auth.uid() and public.in_team(team_id) and (kind = 'prayer' or public.leads_team(team_id))
);
create policy "delete own or led posts" on public.team_posts for delete using (author_id = auth.uid() or public.leads_team(team_id));

create table public.team_post_prayers (
  post_id uuid not null references public.team_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.team_post_prayers enable row level security;
create policy "team sees praying" on public.team_post_prayers for select using (exists (select 1 from public.team_posts p where p.id = post_id and public.in_team(p.team_id)));
create policy "pray for a post" on public.team_post_prayers for insert with check (user_id = auth.uid() and exists (select 1 from public.team_posts p where p.id = post_id and public.in_team(p.team_id)));
create policy "unpray" on public.team_post_prayers for delete using (user_id = auth.uid());

-- Meetings register ---------------------------------------------------------------------
create table public.team_meetings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  held_on date not null default current_date,
  title text not null,
  notes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.team_meeting_attendance (
  meeting_id uuid not null references public.team_meetings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (meeting_id, user_id)
);
alter table public.team_meetings enable row level security;
alter table public.team_meeting_attendance enable row level security;
create policy "team sees meetings" on public.team_meetings for select using (public.in_team(team_id));
create policy "leads manage meetings" on public.team_meetings for all using (public.leads_team(team_id)) with check (public.leads_team(team_id));
create policy "see meeting attendance" on public.team_meeting_attendance for select using (user_id = auth.uid() or exists (select 1 from public.team_meetings m where m.id = meeting_id and public.leads_team(m.team_id)));
create policy "leads record attendance" on public.team_meeting_attendance for all
  using (exists (select 1 from public.team_meetings m where m.id = meeting_id and public.leads_team(m.team_id)))
  with check (exists (select 1 from public.team_meetings m where m.id = meeting_id and public.leads_team(m.team_id)));

-- Invites ---------------------------------------------------------------------------------
alter table public.profiles
  add column if not exists invite_code text unique default lower(substr(md5(gen_random_uuid()::text), 1, 8)),
  add column if not exists invited_by uuid references public.profiles(id) on delete set null;
update public.profiles set invite_code = lower(substr(md5(gen_random_uuid()::text), 1, 8)) where invite_code is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_inviter uuid;
begin
  select id into v_inviter from public.profiles where invite_code = lower(nullif(new.raw_user_meta_data->>'ref', ''));
  insert into public.profiles (id, full_name, email, phone, invited_by)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone', v_inviter);
  return new;
end $$;

create or replace function public.inviter_name(p_code text)
returns text language sql stable security definer set search_path = public as $$
  select split_part(coalesce(full_name, 'A friend'), ' ', 1) from public.profiles where invite_code = lower(p_code);
$$;
grant execute on function public.inviter_name(text) to anon, authenticated;

create or replace function public.my_invites()
returns table (full_name text, status text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.full_name, p.status, p.created_at from public.profiles p where p.invited_by = auth.uid() order by p.created_at desc;
$$;

-- Team people with growth numbers (activity and phone numbers only for leads/pastor) ------
create or replace function public.team_people(p_team uuid)
returns table (
  user_id uuid, full_name text, phone text, role text, title text,
  steps int, lessons int, services int, bible_days int, services_14d int,
  last_active timestamptz, open_tasks int, overdue_tasks int
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_lead boolean := public.leads_team(p_team);
begin
  if not public.in_team(p_team) then
    raise exception 'not allowed';
  end if;
  return query
  select tm.user_id, pr.full_name,
    case when v_lead then pr.phone else null end,
    tm.role, tm.title,
    case when v_lead then (select count(*)::int from public.step_checkins c where c.user_id = tm.user_id) end,
    case when v_lead then (select count(*)::int from public.lesson_progress l where l.user_id = tm.user_id) end,
    case when v_lead then (select count(*)::int from public.attendance a where a.user_id = tm.user_id) end,
    case when v_lead then (select count(*)::int from public.bible_reading b where b.user_id = tm.user_id) end,
    case when v_lead then (select count(*)::int from public.attendance a where a.user_id = tm.user_id and a.service_date >= current_date - 14) end,
    case when v_lead then greatest(
      (select max(created_at) from public.step_checkins c where c.user_id = tm.user_id),
      (select max(completed_at) from public.lesson_progress l where l.user_id = tm.user_id),
      (select max(created_at) from public.attendance a where a.user_id = tm.user_id),
      (select max(read_at) from public.bible_reading b where b.user_id = tm.user_id)
    ) end,
    (select count(*)::int from public.task_assignments t where t.user_id = tm.user_id and t.team_id = p_team and t.status in ('todo', 'redo')),
    (select count(*)::int from public.task_assignments t join public.team_tasks k on k.id = t.task_id
       where t.user_id = tm.user_id and t.team_id = p_team and t.status in ('todo', 'redo') and k.due_at < now())
  from public.team_members tm
  join public.profiles pr on pr.id = tm.user_id
  where tm.team_id = p_team
  order by case tm.role when 'lead' then 0 when 'assistant' then 1 else 2 end, pr.full_name;
end $$;
