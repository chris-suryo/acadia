-- Round 20: not everything on a packing list matters equally.
--
-- Group gear was thirty-nine rows, each with an identical "claim" chip and a
-- bar reading "0 of 39 claimed" — which is both demoralising and false, since
-- nobody needs all thirty-nine. It gave no way to tell that the camp stove is
-- load-bearing and the camp broom is not. Two days out the only question worth
-- answering is "what has nobody signed up for that we can't do without", and
-- the tab couldn't answer it.
--
-- The test for `essential` is narrow on purpose: would you drive back to
-- Ellsworth for it? Fourteen of thirty-nine pass. If the flag covered half the
-- list it would mean nothing again.

alter table gear_items add column if not exists essential boolean not null default false;
alter table personal_items add column if not exists essential boolean not null default false;

update gear_items set essential = true where label in (
  'Tarp or canopy',                       -- rain is forecast Friday morning
  'Camp stove + fuel',
  'Propane canisters ×2',
  'Pots, pans, cooking utensils',
  'Cutting board + sharp knife',
  'Big cooler + ice',
  'Dish bin, soap, sponge, towel',        -- nine meals for eleven people
  'Water jug',
  'Coffee — percolator or press, and filters',
  'Firewood — buy local, don''t transport',
  'Fire starter + lighter',
  'Lanterns / string lights',             -- no outlets, and it gets properly dark
  'Group first-aid kit',
  'Trash + recycling bags'                -- it all packs out
);

-- The nine that make the difference between a good weekend and a cold, wet,
-- itchy one. Same narrowness: this is not "important", it's "you will regret it".
update personal_items set essential = true where label in (
  'Sleeping pad or air mattress',
  'Sleeping bag',
  'Warm layer — fleece or puffy',
  'Rain jacket',
  'Hiking shoes with tread',
  'Headlamp or flashlight',
  'Water bottle',
  'Personal meds',
  'Bug spray'
);

-- Party of eleven, not twelve. Two stragglers from before the roster was real.
update gear_items set label = 'Mugs + cups for eleven'
  where label = 'Mugs + cups for twelve';
update personal_items set note = 'eleven people, one campfire, thin nylon walls'
  where note = 'twelve people, one campfire, thin nylon walls';

-- Anyone who opens the app for the first time from here on gets the flag too,
-- so a phone that arrives on Friday isn't the one phone with a flat list.
--
-- Dropped rather than replaced: the return type gains a column, and `create or
-- replace` refuses that. Nothing holds a hard dependency on it — the only
-- caller resolves the name at runtime — but the two must land in one migration.
drop function if exists public.personal_seed_rows();

create or replace function public.personal_seed_rows()
returns table(category text, label text, note text, sort integer, essential boolean)
language sql
immutable
as $function$
  select * from (values
    ('Sleep', 'Sleeping pad or air mattress', 'insulation from the ground, not just cushion', 1, true),
    ('Sleep', 'Sleeping bag', 'nights around 55°F — ask Alana if you don''t own one', 2, true),
    ('Sleep', 'Pillow', '', 3, false),
    ('Sleep', 'Tent, if you have your own', '', 4, false),
    ('Sleep', 'Earplugs + eye mask', 'eleven people, one campfire, thin nylon walls', 5, false),
    ('Clothing', 'Warm layer — fleece or puffy', 'the thing first-timers forget', 1, true),
    ('Clothing', 'Rain jacket', 'shower expected Friday morning', 2, true),
    ('Clothing', 'Hiking shoes with tread', 'the trails here are granite', 3, true),
    ('Clothing', 'Camp shoes or sandals', '', 4, false),
    ('Clothing', 'Socks — days plus one', '', 5, false),
    ('Clothing', 'Hat + sunglasses', '', 6, false),
    ('Clothing', 'Long pants for the evening', 'ticks in the grass, mosquitoes after dark', 7, false),
    ('Clothing', 'Beanie', 'it drops to the mid-50s overnight', 8, false),
    ('Mess Kit', 'Plate, bowl, cup, utensils', 'reusable — trash packs out', 1, false),
    ('Mess Kit', 'Water bottle', 'spigots at camp, no filter needed', 2, true),
    ('Mess Kit', 'Mug for coffee', '', 3, false),
    ('Mess Kit', 'Dish towel', '', 4, false),
    ('Essentials', 'Headlamp or flashlight', '', 1, true),
    ('Essentials', 'Portable charger', 'no outlets at the sites', 2, false),
    ('Essentials', 'Personal meds', '', 3, true),
    ('Essentials', 'Park pass, or card for the gate', '', 4, false),
    ('Essentials', 'Offline maps downloaded', 'cell service drops inside the park', 5, false),
    ('Essentials', 'Daypack for the hikes', 'water, layer, snacks', 6, false),
    ('Essentials', 'Cash + quarters', 'the Otter Creek showers are coin-op', 7, false),
    ('Toiletries', 'Toothbrush + toothpaste', '', 1, false),
    ('Toiletries', 'Sunscreen', '', 2, false),
    ('Toiletries', 'Bug spray', '', 3, true),
    ('Toiletries', 'Wet wipes / hand sanitizer', 'no showers at Blackwoods', 4, false),
    ('Toiletries', 'Quick-dry towel', '', 5, false),
    ('Toiletries', 'Flip-flops for the showers', '', 6, false),
    ('Toiletries', 'Lip balm with SPF', '', 7, false),
    ('Extras', 'Camp chair', '', 1, false),
    ('Extras', 'Swimsuit', '', 2, false),
    ('Extras', 'Cards, book, speaker', '', 3, false),
    ('Extras', 'Dry bag or a ziplock for your phone', '', 4, false),
    ('Extras', 'Trekking poles, if you use them', '', 5, false)
  ) as s(category, label, note, sort, essential);
$function$;

create or replace function public.seed_personal_items()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  insert into personal_items (user_id, category, label, note, checked, sort, essential)
  select auth.uid(), s.category, s.label, s.note, false, s.sort, s.essential
  from personal_seed_rows() s
  where not exists (
    select 1 from personal_items p where p.user_id = auth.uid()
  );
end;
$function$;
