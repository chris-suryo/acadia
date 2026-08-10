-- Trip questionnaire: one row per person, written from the Welcome intro or
-- edited later on the Ideas board. Same trust model as profiles: everyone
-- reads, you write your own.

create table survey (
  user_id uuid primary key references profiles (id) on delete cascade,
  activity text not null default '',
  hikes text not null default '',
  wants text not null default '',
  bar_harbor text not null default '',
  food text not null default '',
  updated_at timestamptz not null default now()
);

alter table survey enable row level security;

create policy "survey read" on survey
  for select to authenticated using (true);
create policy "survey insert own" on survey
  for insert to authenticated with check (user_id = auth.uid());
create policy "survey update own" on survey
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter publication supabase_realtime add table survey;
