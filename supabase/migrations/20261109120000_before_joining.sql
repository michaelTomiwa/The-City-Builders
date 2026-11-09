-- Assignments that were due before someone joined are optional for them:
-- handing one in is never counted as late.
create or replace function public.stamp_submission_late() returns trigger
language plpgsql security definer set search_path = public as $$
declare due timestamptz; joined timestamptz;
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
  select p.created_at into joined from public.profiles p where p.id = new.user_id;
  new.late := due is not null and now() > due and (joined is null or due > joined);
  if not new.late then
    new.late_reason := null;
    new.late_note := null;
  end if;
  return new;
end $$;
