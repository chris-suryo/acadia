-- Round 11: make both packing lists actually complete for twelve people over
-- two nights, and add a Dogs section (this trip's content is full of leashes,
-- dog patios and BARK-ranger links).
--
-- Both halves are written to be safe to re-run: gear inserts skip labels that
-- already exist, and the personal backfill skips labels a person already has.

-- ── group gear ────────────────────────────────────────────────────────────
insert into gear_items (category, label, sort)
select v.category, v.label, v.sort
from (values
  ('Shelter', 'Ground tarps or footprints', 4),
  ('Shelter', 'Extra stakes + guylines', 5),
  ('Camp Kitchen', 'Coffee — percolator or press, and filters', 9),
  ('Camp Kitchen', 'Second cooler — drinks only', 10),
  ('Camp Kitchen', 'Ice — restock Saturday', 11),
  ('Camp Kitchen', 'Griddle or grill grate', 12),
  ('Camp Kitchen', 'Mugs + cups for twelve', 13),
  ('Camp Kitchen', 'Oil, salt, pepper, spice kit', 14),
  ('Camp Kitchen', 'Bottle opener + corkscrew', 15),
  ('Fire & Light', 'Spare batteries + a backup headlamp', 4),
  ('Fire & Light', 'Fire gloves + poker', 5),
  ('Site & Safety', 'Tick remover + tweezers', 4),
  ('Site & Safety', 'Bins for the food — it all goes in the cars overnight', 5),
  ('Site & Safety', 'Paracord clothesline + clips', 6),
  ('Site & Safety', 'Camp broom + dustpan', 7),
  ('Site & Safety', 'Quarters for the Otter Creek showers', 8),
  ('Dogs', 'Leashes — six feet max in the park', 1),
  ('Dogs', 'Tie-out line for the site', 2),
  ('Dogs', 'Water bowls', 3),
  ('Dogs', 'Waste bags', 4),
  ('Dogs', 'Bed or blanket, and a towel for wet dogs', 5)
) as v(category, label, sort)
where not exists (select 1 from gear_items g where g.label = v.label);

-- ── personal list: one list of truth, used for both new and existing people ─
create or replace function public.personal_seed_rows()
returns table (category text, label text, note text, sort int)
language sql immutable as $$
  select * from (values
    ('Sleep', 'Sleeping pad or air mattress', 'insulation from the ground, not just cushion', 1),
    ('Sleep', 'Sleeping bag', 'nights around 55°F — ask Alana if you don''t own one', 2),
    ('Sleep', 'Pillow', '', 3),
    ('Sleep', 'Tent, if you have your own', '', 4),
    ('Sleep', 'Earplugs + eye mask', 'twelve people, one campfire, thin nylon walls', 5),
    ('Clothing', 'Warm layer — fleece or puffy', 'the thing first-timers forget', 1),
    ('Clothing', 'Rain jacket', 'shower expected Friday morning', 2),
    ('Clothing', 'Hiking shoes with tread', 'the trails here are granite', 3),
    ('Clothing', 'Camp shoes or sandals', '', 4),
    ('Clothing', 'Socks — days plus one', '', 5),
    ('Clothing', 'Hat + sunglasses', '', 6),
    ('Clothing', 'Long pants for the evening', 'ticks in the grass, mosquitoes after dark', 7),
    ('Clothing', 'Beanie', 'it drops to the mid-50s overnight', 8),
    ('Mess Kit', 'Plate, bowl, cup, utensils', 'reusable — trash packs out', 1),
    ('Mess Kit', 'Water bottle', 'spigots at camp, no filter needed', 2),
    ('Mess Kit', 'Mug for coffee', '', 3),
    ('Mess Kit', 'Dish towel', '', 4),
    ('Essentials', 'Headlamp or flashlight', '', 1),
    ('Essentials', 'Portable charger', 'no outlets at the sites', 2),
    ('Essentials', 'Personal meds', '', 3),
    ('Essentials', 'Park pass, or card for the gate', '', 4),
    ('Essentials', 'Offline maps downloaded', 'cell service drops inside the park', 5),
    ('Essentials', 'Daypack for the hikes', 'water, layer, snacks', 6),
    ('Essentials', 'Cash + quarters', 'the Otter Creek showers are coin-op', 7),
    ('Toiletries', 'Toothbrush + toothpaste', '', 1),
    ('Toiletries', 'Sunscreen', '', 2),
    ('Toiletries', 'Bug spray', '', 3),
    ('Toiletries', 'Wet wipes / hand sanitizer', 'no showers at Blackwoods', 4),
    ('Toiletries', 'Quick-dry towel', '', 5),
    ('Toiletries', 'Flip-flops for the showers', '', 6),
    ('Toiletries', 'Lip balm with SPF', '', 7),
    ('Extras', 'Camp chair', '', 1),
    ('Extras', 'Swimsuit', '', 2),
    ('Extras', 'Cards, book, speaker', '', 3),
    ('Extras', 'Dry bag or a ziplock for your phone', '', 4),
    ('Extras', 'Trekking poles, if you use them', '', 5)
  ) as s(category, label, note, sort);
$$;

create or replace function public.seed_personal_items()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  insert into personal_items (user_id, category, label, note, checked, sort)
  select auth.uid(), s.category, s.label, s.note, false, s.sort
  from personal_seed_rows() s
  where not exists (
    select 1 from personal_items p where p.user_id = auth.uid()
  );
end;
$$;

-- Everyone who already opened the app has the short list. Give them the new
-- rows without touching what they've already ticked off or added themselves.
insert into personal_items (user_id, category, label, note, checked, sort)
select u.user_id, s.category, s.label, s.note, false, s.sort
from (select distinct user_id from personal_items) u
cross join personal_seed_rows() s
where not exists (
  select 1 from personal_items p
  where p.user_id = u.user_id and p.label = s.label
);
