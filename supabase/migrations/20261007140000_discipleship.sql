-- City Builders discipleship: members, programmes (daily steps), assignments
-- with submissions, journals and notices from the pastor.

-- Members ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'pending',
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists last_seen_at timestamptz;
alter table public.profiles add constraint profiles_status_check check (status in ('pending', 'active', 'inactive'));
update public.profiles set status = 'active' where role in ('admin', 'author');

-- Only admins may change anyone's role or approval. New profiles always start as pending members.
-- (Before this, "update own profile" let any signed-in user set their own role.)
create or replace function public.guard_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := 'member';
    new.status := 'pending';
  elsif new.role is distinct from old.role or new.status is distinct from old.status then
    raise exception 'Only an admin can change roles or approval';
  end if;
  return new;
end $$;

create trigger guard_profile before insert or update on public.profiles
  for each row execute function public.guard_profile();
create policy "admins update profiles" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone');
  return new;
end $$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (status = 'active' or role in ('admin', 'author'))
  );
$$;

-- Programmes --------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  objective text,
  teaching text,
  cover_image_url text,
  start_date date not null default current_date,
  days int not null default 3 check (days between 1 and 90),
  audience text not null default 'everyone' check (audience in ('everyone', 'selected')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_steps (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  day int not null check (day >= 1),
  sort int not null default 0,
  kind text not null default 'pray' check (kind in ('pray', 'fast', 'study', 'worship', 'attend', 'serve', 'give', 'reflect', 'custom')),
  title text not null,
  details text,
  scripture text,
  minutes int
);
create index on public.program_steps (program_id, day, sort);

create table public.program_members (
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (program_id, user_id)
);

create table public.step_checkins (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.program_steps(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  note text,
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  unique (step_id, user_id)
);
create index on public.step_checkins (user_id, created_at);
create index on public.step_checkins (program_id);

-- Assignments, journal, notices -----------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructions text,
  resources text,
  program_id uuid references public.programs(id) on delete set null,
  due_at timestamptz,
  audience text not null default 'everyone' check (audience in ('everyone', 'selected')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignment_members (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (assignment_id, user_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text,
  file_path text,
  file_name text,
  link_url text,
  status text not null default 'submitted' check (status in ('submitted', 'needs_work', 'reviewed')),
  feedback text,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, user_id)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text,
  body text not null,
  shared boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.journal_entries (user_id, created_at);

create table public.member_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Who can see what -----------------------------------------------------------------
create or replace function public.can_see_program(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or (
    public.is_member() and exists (
      select 1 from public.programs p
      where p.id = p_id and p.status = 'published'
        and (p.audience = 'everyone'
             or exists (select 1 from public.program_members m where m.program_id = p.id and m.user_id = auth.uid()))
    )
  );
$$;

create or replace function public.can_see_assignment(a_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or (
    public.is_member() and exists (
      select 1 from public.assignments a
      where a.id = a_id and a.status = 'published'
        and (a.audience = 'everyone'
             or exists (select 1 from public.assignment_members m where m.assignment_id = a.id and m.user_id = auth.uid()))
    )
  );
$$;

alter table public.programs enable row level security;
alter table public.program_steps enable row level security;
alter table public.program_members enable row level security;
alter table public.step_checkins enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_members enable row level security;
alter table public.submissions enable row level security;
alter table public.journal_entries enable row level security;
alter table public.member_notices enable row level security;

create policy "see programs" on public.programs for select using (public.can_see_program(id));
create policy "admins manage programs" on public.programs for all using (public.is_admin()) with check (public.is_admin());
create policy "see steps" on public.program_steps for select using (public.can_see_program(program_id));
create policy "admins manage steps" on public.program_steps for all using (public.is_admin()) with check (public.is_admin());
create policy "see own program membership" on public.program_members for select using (user_id = auth.uid() or public.is_admin());
create policy "admins manage program members" on public.program_members for all using (public.is_admin()) with check (public.is_admin());
create policy "see own checkins" on public.step_checkins for select using (user_id = auth.uid() or public.is_admin());
create policy "check in" on public.step_checkins for insert with check (user_id = auth.uid() and public.can_see_program(program_id));
create policy "edit own checkin" on public.step_checkins for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "undo own checkin" on public.step_checkins for delete using (user_id = auth.uid());

create policy "see assignments" on public.assignments for select using (public.can_see_assignment(id));
create policy "admins manage assignments" on public.assignments for all using (public.is_admin()) with check (public.is_admin());
create policy "see own assignment membership" on public.assignment_members for select using (user_id = auth.uid() or public.is_admin());
create policy "admins manage assignment members" on public.assignment_members for all using (public.is_admin()) with check (public.is_admin());
create policy "see own submissions" on public.submissions for select using (user_id = auth.uid() or public.is_admin());
create policy "submit" on public.submissions for insert with check (user_id = auth.uid() and public.can_see_assignment(assignment_id));
create policy "edit own submission" on public.submissions for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "own journal" on public.journal_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins read shared journal" on public.journal_entries for select using (shared and public.is_admin());
create policy "members read notices" on public.member_notices for select using (public.is_member());
create policy "admins manage notices" on public.member_notices for all using (public.is_admin()) with check (public.is_admin());

-- Members can't set their own review status or feedback; editing resubmits.
create or replace function public.guard_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() and new.user_id is distinct from auth.uid() then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.feedback := old.feedback;
    new.reviewed_at := old.reviewed_at;
    new.user_id := old.user_id;
    new.assignment_id := old.assignment_id;
  else
    new.feedback := null;
    new.reviewed_at := null;
  end if;
  new.status := 'submitted';
  new.updated_at := now();
  return new;
end $$;
create trigger guard_submission before insert or update on public.submissions
  for each row execute function public.guard_submission();

-- Private bucket for files members attach to submissions: <user id>/<file>
insert into storage.buckets (id, name, public, file_size_limit)
values ('submissions', 'submissions', false, 20971520)
on conflict (id) do nothing;
create policy "members upload own submission files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text and public.is_member());
create policy "read own submission files" on storage.objects
  for select to authenticated
  using (bucket_id = 'submissions' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
