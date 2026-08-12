-- Round 26: a pass against what a full car-camping checklist covers.
--
-- Seven more, from walking the standard categories rather than the menu.
-- One of them is a fourth casualty of the label trimming in 0026: "Wet wipes /
-- hand sanitizer" became "Wet wipes", and with no showers at Blackwoods and
-- eleven people handling food, the sanitiser is the half that mattered.
--
-- The rest are things a list of this kind always has and ours didn't: a bowl
-- big enough to scramble three dozen eggs in, something over the picnic table,
-- chairs for the people who don't own one, a hatchet for kindling, a blanket
-- for sitting out at 55°F, and — since socks and underwear were both listed
-- while the rest of the clothes were not — actual clothes.

insert into gear_items (category, label, sort, essential)
select * from (values
  -- Eleven people, and not everyone owns a chair.
  ('Shelter', 'Camp chairs — spares', 7, false),
  -- Three dozen eggs don't scramble in a saucepan.
  ('Camp Kitchen', 'Big mixing bowl', 21, false),
  ('Camp Kitchen', 'Tablecloth + clips', 22, false),
  -- The wood you buy on the island comes split, but not to kindling.
  ('Fire & Light', 'Hatchet for kindling', 9, false)
) as v(category, label, sort, essential)
where not exists (select 1 from gear_items g where g.label = v.label);

insert into personal_items (user_id, category, label, note, checked, sort, essential)
select p.id, v.category, v.label, v.note, false, v.sort, v.essential
from profiles p
cross join (values
  ('Sleep', 'Extra blanket', '', 6, false),
  ('Clothing', 'Shirts + shorts for three days', '', 10, false),
  ('Toiletries', 'Hand sanitizer', 'no showers, and everyone handles the food', 8, true)
) as v(category, label, note, sort, essential)
where not exists (
  select 1 from personal_items x where x.user_id = p.id and x.label = v.label
);

drop function if exists public.personal_seed_rows();

create or replace function public.personal_seed_rows()
returns table(category text, label text, note text, sort integer, essential boolean)
language sql
immutable
as $function$
  select * from (values
    ('Sleep', 'Sleeping pad', '', 1, true),
    ('Sleep', 'Sleeping bag', 'around 55°F at night — ask Alana for a spare', 2, true),
    ('Sleep', 'Pillow', '', 3, false),
    ('Sleep', 'Tent, if you have one', '', 4, false),
    ('Sleep', 'Earplugs + eye mask', '', 5, false),
    ('Sleep', 'Extra blanket', '', 6, false),
    ('Clothing', 'Warm layer', '', 1, true),
    ('Clothing', 'Rain jacket', 'rain Friday morning', 2, true),
    ('Clothing', 'Hiking shoes', '', 3, true),
    ('Clothing', 'Camp shoes', '', 4, false),
    ('Clothing', 'Socks', '', 5, false),
    ('Clothing', 'Hat + sunglasses', '', 6, false),
    ('Clothing', 'Long pants', '', 7, false),
    ('Clothing', 'Beanie', '', 8, false),
    ('Clothing', 'Underwear', '', 9, false),
    ('Clothing', 'Shirts + shorts for three days', '', 10, false),
    ('Mess Kit', 'Plate, bowl, utensils', '', 1, false),
    ('Mess Kit', 'Water bottle', '', 2, true),
    ('Mess Kit', 'Mug for coffee', '', 3, false),
    ('Mess Kit', 'Dish towel', '', 4, false),
    ('Essentials', 'Headlamp', '', 1, true),
    ('Essentials', 'Portable charger', 'no outlets at camp', 2, false),
    ('Essentials', 'Personal meds', '', 3, true),
    ('Essentials', 'Park pass or card', '', 4, false),
    ('Essentials', 'Offline maps', '', 5, false),
    ('Essentials', 'Daypack', '', 6, false),
    ('Essentials', 'Cash + quarters', 'the showers are coin-op', 7, false),
    ('Essentials', 'Charging cable', '', 8, false),
    ('Toiletries', 'Toothbrush + toothpaste', '', 1, false),
    ('Toiletries', 'Sunscreen', '', 2, false),
    ('Toiletries', 'Bug spray', '', 3, true),
    ('Toiletries', 'Wet wipes', 'no showers at Blackwoods', 4, false),
    ('Toiletries', 'Towel', '', 5, false),
    ('Toiletries', 'Shower flip-flops', '', 6, false),
    ('Toiletries', 'Lip balm', '', 7, false),
    ('Toiletries', 'Hand sanitizer', 'no showers, and everyone handles the food', 8, true),
    ('Extras', 'Camp chair', '', 1, false),
    ('Extras', 'Swimsuit', '', 2, false),
    ('Extras', 'Cards, book, speaker', '', 3, false),
    ('Extras', 'Dry bag for your phone', '', 4, false),
    ('Extras', 'Trekking poles', '', 5, false)
  ) as s(category, label, note, sort, essential);
$function$;
