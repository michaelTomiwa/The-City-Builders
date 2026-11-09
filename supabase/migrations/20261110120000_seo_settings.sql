-- For search: the pastor's own bio (pastor page) and the church's address,
-- if it meets in person (shown to Google and on the site).
alter table public.site_settings
  add column if not exists pastor_bio text check (length(pastor_bio) <= 5000),
  add column if not exists church_address text check (length(church_address) <= 300);
