-- RLS (BUILD_SPEC §5): open collaboration on shared tables for the 12-person
-- trusted group; personal_items strictly private; forecast_cache written only
-- by the weather edge function (service role bypasses RLS).

alter table profiles enable row level security;
alter table itinerary_days enable row level security;
alter table itinerary_blocks enable row level security;
alter table gear_items enable row level security;
alter table personal_items enable row level security;
alter table menu_items enable row level security;
alter table shopping_items enable row level security;
alter table expenses enable row level security;
alter table forecast_cache enable row level security;

create policy "profiles read" on profiles
  for select to authenticated using (true);
create policy "profiles insert own" on profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "days open" on itinerary_days
  for all to authenticated using (true) with check (true);
create policy "blocks open" on itinerary_blocks
  for all to authenticated using (true) with check (true);
create policy "gear open" on gear_items
  for all to authenticated using (true) with check (true);
create policy "menu open" on menu_items
  for all to authenticated using (true) with check (true);
create policy "shopping open" on shopping_items
  for all to authenticated using (true) with check (true);

create policy "personal own" on personal_items
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "expenses read" on expenses
  for select to authenticated using (true);
create policy "expenses insert own" on expenses
  for insert to authenticated with check (user_id = auth.uid());
create policy "expenses update own" on expenses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "expenses delete own" on expenses
  for delete to authenticated using (user_id = auth.uid());

create policy "forecast read" on forecast_cache
  for select to authenticated using (true);

-- Live sync between phones at camp.
alter publication supabase_realtime add table
  profiles, itinerary_blocks, gear_items, menu_items, shopping_items,
  expenses, forecast_cache;

-- Copies the personal packing list template into a fresh profile exactly once.
create or replace function public.seed_personal_items()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  insert into personal_items (user_id, category, label, note, checked, sort)
  select auth.uid(), s.category, s.label, s.note, false, s.sort
  from (values
    ('Sleep', 'Sleeping pad or air mattress', 'insulation from the ground, not just cushion', 1),
    ('Sleep', 'Sleeping bag', 'nights around 55°F — ask Alana if you don''t own one', 2),
    ('Sleep', 'Pillow', '', 3),
    ('Sleep', 'Tent, if you have your own', '', 4),
    ('Clothing', 'Warm layer — fleece or puffy', 'the thing first-timers forget', 1),
    ('Clothing', 'Rain jacket', 'shower expected Friday morning', 2),
    ('Clothing', 'Hiking shoes with tread', 'the trails here are granite', 3),
    ('Clothing', 'Camp shoes or sandals', '', 4),
    ('Clothing', 'Socks — days plus one', '', 5),
    ('Clothing', 'Hat + sunglasses', '', 6),
    ('Mess Kit', 'Plate, bowl, cup, utensils', 'reusable — trash packs out', 1),
    ('Mess Kit', 'Water bottle', 'spigots at camp, no filter needed', 2),
    ('Essentials', 'Headlamp or flashlight', '', 1),
    ('Essentials', 'Portable charger', 'no outlets at the sites', 2),
    ('Essentials', 'Personal meds', '', 3),
    ('Essentials', 'Park pass, or card for the gate', '', 4),
    ('Essentials', 'Offline maps downloaded', 'cell service drops inside the park', 5),
    ('Toiletries', 'Toothbrush + toothpaste', '', 1),
    ('Toiletries', 'Sunscreen', '', 2),
    ('Toiletries', 'Bug spray', '', 3),
    ('Toiletries', 'Wet wipes / hand sanitizer', 'no showers at Blackwoods', 4),
    ('Toiletries', 'Quick-dry towel', '', 5),
    ('Extras', 'Camp chair', '', 1),
    ('Extras', 'Swimsuit', '', 2),
    ('Extras', 'Cards, book, speaker', '', 3)
  ) as s(category, label, note, sort)
  where not exists (
    select 1 from personal_items p where p.user_id = auth.uid()
  );
end;
$$;

revoke execute on function public.seed_personal_items() from public, anon;
grant execute on function public.seed_personal_items() to authenticated;
