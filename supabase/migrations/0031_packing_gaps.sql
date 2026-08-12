-- Round 25: the things the menu needs that nobody was bringing.
--
-- Cross-referencing the ballot against the gear list turned up seven holes.
-- Three of them I made myself in 0026, shortening labels: "Foil, ziplocks,
-- paper towels" lost the paper towels, "Multi-tool, duct tape, mallet" lost the
-- mallet, and "Spare batteries + a backup headlamp" lost the headlamp. Trimming
-- a label is fine; trimming an item out of a list by trimming its label is not.
--
-- The rest are new. Two of five Friday dinners open cans and there was no can
-- opener. Burgers go on a grate and foil packets come out of coals, with
-- nothing to lift either. S'mores are on the shopping list with nothing to
-- roast them on. And a fire has to be dead out before you sleep, which is a
-- park rule as well as good sense — there was no bucket.

insert into gear_items (category, label, sort, essential)
select * from (values
  -- Blackwoods pitches are hard-packed; stakes don't go in by hand.
  ('Shelter', 'Mallet for the stakes', 6, false),

  -- You cannot open the beans without it, and two dinners are beans.
  ('Camp Kitchen', 'Can opener', 18, true),
  -- Nothing else lifts a burger off a grate or a packet out of the coals.
  ('Camp Kitchen', 'Tongs + spatula', 19, true),
  ('Camp Kitchen', 'Paper towels', 20, false),

  ('Fire & Light', 'Roasting sticks', 6, false),
  -- Fires out before you sleep. This is the thing that does it.
  ('Fire & Light', 'Water bucket for the fire', 7, true),
  ('Fire & Light', 'Backup headlamp', 8, false)
) as v(category, label, sort, essential)
where not exists (select 1 from gear_items g where g.label = v.label);

-- Camp Kitchen had grown to twenty-one rows, which is a scroll rather than a
-- section. The cold half is a coherent thing on its own — it's what you load
-- last and unload first.
update gear_items set category = 'Coolers & Water', sort = case label
    when 'Big cooler + ice' then 1
    when 'Second cooler — drinks' then 2
    when 'Ice' then 3
    when 'Water jug' then 4
    else sort end
where label in ('Big cooler + ice', 'Second cooler — drinks', 'Ice', 'Water jug');

-- Two more on the personal list. People bring the battery and forget the cable,
-- and socks were listed while the other thing was not.
insert into personal_items (user_id, category, label, note, checked, sort, essential)
select p.id, v.category, v.label, '', false, v.sort, v.essential
from profiles p
cross join (values
  ('Clothing', 'Underwear', 9, false),
  ('Essentials', 'Charging cable', 8, false)
) as v(category, label, sort, essential)
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
    ('Clothing', 'Warm layer', '', 1, true),
    ('Clothing', 'Rain jacket', 'rain Friday morning', 2, true),
    ('Clothing', 'Hiking shoes', '', 3, true),
    ('Clothing', 'Camp shoes', '', 4, false),
    ('Clothing', 'Socks', '', 5, false),
    ('Clothing', 'Hat + sunglasses', '', 6, false),
    ('Clothing', 'Long pants', '', 7, false),
    ('Clothing', 'Beanie', '', 8, false),
    ('Clothing', 'Underwear', '', 9, false),
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
    ('Extras', 'Camp chair', '', 1, false),
    ('Extras', 'Swimsuit', '', 2, false),
    ('Extras', 'Cards, book, speaker', '', 3, false),
    ('Extras', 'Dry bag for your phone', '', 4, false),
    ('Extras', 'Trekking poles', '', 5, false)
  ) as s(category, label, note, sort, essential);
$function$;
