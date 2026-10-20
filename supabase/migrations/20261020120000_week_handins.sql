-- This Week items can ask people to hand something in: a write-up, a report,
-- or a file (PDF, document, photo, voice note). The pastor reads them and can
-- reply. Files go in the private "submissions" bucket under <user id>/week/.

alter table public.week_items
  add column submit text not null default 'none' check (submit in ('none', 'optional', 'required')),
  add column submit_prompt text check (length(submit_prompt) <= 500);

alter table public.week_ticks
  add column body text check (length(body) <= 20000),
  add column file_path text check (length(file_path) <= 300),
  add column file_name text check (length(file_name) <= 200),
  add column updated_at timestamptz not null default now(),
  add column feedback text check (length(feedback) <= 4000),
  add column reviewed_at timestamptz;

-- Members can't write the pastor's reply, can only attach their own files,
-- and must hand something in when the item requires it.
create or replace function public.guard_week_tick() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_submit text;
begin
  if not is_admin() then
    if tg_op = 'INSERT' then
      new.feedback := null;
      new.reviewed_at := null;
    else
      new.feedback := old.feedback;
      new.reviewed_at := old.reviewed_at;
    end if;
    if new.file_path is not null and new.file_path not like auth.uid()::text || '/%' then
      raise exception 'You can only attach your own files.';
    end if;
    select submit into v_submit from public.week_items where id = new.item_id;
    if v_submit = 'required' and coalesce(trim(new.body), '') = '' and new.file_path is null then
      raise exception 'This one needs something handed in: write it up or attach a file.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger guard_week_tick before insert or update on public.week_ticks
  for each row execute function public.guard_week_tick();

create policy "staff review ticks" on public.week_ticks for update using (is_admin()) with check (is_admin());
