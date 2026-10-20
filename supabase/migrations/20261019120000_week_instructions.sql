-- The weekly instruction: one per week from the pastor to the whole church.
-- What to fast, what to pray, what to study. Published ones are public.

create table public.week_instructions (
  week_start date primary key check (extract(isodow from week_start) = 1),
  theme text not null check (length(theme) between 1 and 200),
  word text check (length(word) <= 5000),
  fast_days int[] not null default '{}', -- 1 = Monday ... 7 = Sunday
  fast_plan text check (length(fast_plan) <= 500),
  prayer_points text[] not null default '{}',
  prayer_plan text check (length(prayer_plan) <= 500),
  readings text[] not null default '{}', -- 7 entries, Monday to Sunday ('' = none)
  memory_verse text check (length(memory_verse) <= 500),
  question text check (length(question) <= 500),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  check (fast_days <@ array[1, 2, 3, 4, 5, 6, 7]),
  check (cardinality(prayer_points) <= 20),
  check (cardinality(readings) <= 7)
);

alter table public.week_instructions enable row level security;

create policy "anyone reads published instructions" on public.week_instructions for select
  using (status = 'published' or is_admin());
create policy "staff manage instructions" on public.week_instructions for all
  using (is_admin()) with check (is_admin());

grant select on public.week_instructions to anon, authenticated;
grant insert, update, delete on public.week_instructions to authenticated;
