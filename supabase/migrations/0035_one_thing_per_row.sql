-- Round 29: one physical thing per row.
--
-- "Tents — spares" wasn't a thing anyone owns; "Cutting board + knife" was two
-- things one person had to bring together; the propane hung indented under the
-- stove as the list's only child row. Now that several people can claim one
-- row, the row has to BE one thing — you can have tongs and no spatula, and
-- the person with the spatula needs somewhere to say so.
--
-- Renames are in place so the 24 existing claims survive. Where a claimed
-- compound splits, the claimer keeps both halves: claiming "Foil + ziplocks"
-- meant bringing both, so Chris lands on "Aluminum foil" and "Ziplock bags".
-- Genuine sets stay together (spice kit, first-aid kit, pots + pans,
-- toothbrush + toothpaste): those are grabbed as one object.

-- ---- renames, id-preserving --------------------------------------------

update gear_items as g set label = v.next
from (values
  ('Tents — spares',            'Tents'),
  ('Sleeping bags — spares',    'Spare sleeping bags'),
  ('Camp chairs — spares',      'Extra camp chairs'),
  ('Stakes + guylines',         'Extra tent stakes'),
  ('Mallet for the stakes',     'Mallet'),
  ('Camp stove + fuel',         'Camp stove'),
  ('Propane ×2',                'Propane'),
  ('Second stove or burner',    'Second stove'),
  ('Flat griddle for the fire', 'Griddle for the fire'),
  ('Pots, pans, utensils',      'Pots + pans'),
  ('Cutting board + knife',     'Cutting board'),
  ('Tongs + spatula',           'Tongs'),
  ('Coffee + filters',          'Coffee maker — press or percolator'),
  ('Mugs + cups',               'Cups'),
  ('Dish bin + soap',           'Dish bin'),
  ('Foil + ziplocks',           'Aluminum foil'),
  ('Big cooler + ice',          'Big cooler'),
  ('Second cooler — drinks',    'Drinks cooler'),
  ('Fire starter + lighter',    'Fire starters'),
  ('Hatchet for kindling',      'Hatchet'),
  ('Fire gloves + poker',       'Fire gloves'),
  ('Backup headlamp',           'Spare headlamp'),
  ('Trash + recycling bags',    'Trash bags'),
  ('Multi-tool + duct tape',    'Multi-tool'),
  ('Dog bed + towel',           'Dog beds')
) as v(prev, next)
where g.label = v.prev;

-- The one child row goes flat. Nothing else ever nested.
update gear_items set parent_id = null where label = 'Propane';

-- ---- the split-off halves ----------------------------------------------

insert into gear_items (category, label, sort, essential)
select * from (values
  ('Shelter',      'Guylines',        90, false),
  ('Camp Kitchen', 'Cooking utensils',91, true),
  ('Camp Kitchen', 'Sharp knife',     92, true),
  ('Camp Kitchen', 'Spatula',         93, true),
  ('Camp Kitchen', 'Coffee filters',  94, false),
  ('Camp Kitchen', 'Dish soap + sponges', 95, false),
  ('Camp Kitchen', 'Ziplock bags',    96, false),
  ('Fire & Light', 'Lighters',        97, true),
  ('Fire & Light', 'Fire poker',      98, false),
  ('Site & Safety','Duct tape',       99, false),
  ('Dogs',         'Dog towels',     100, false)
) as v(category, label, sort, essential)
where not exists (select 1 from gear_items g where g.label = v.label);

-- Whoever claimed the compound claimed both halves.
insert into gear_claims (gear_item_id, user_id)
select tgt.id, c.user_id
from (values
  ('Extra tent stakes', 'Guylines'),
  ('Pots + pans',       'Cooking utensils'),
  ('Cutting board',     'Sharp knife'),
  ('Tongs',             'Spatula'),
  ('Coffee maker — press or percolator', 'Coffee filters'),
  ('Dish bin',          'Dish soap + sponges'),
  ('Aluminum foil',     'Ziplock bags'),
  ('Fire starters',     'Lighters'),
  ('Fire gloves',       'Fire poker'),
  ('Multi-tool',        'Duct tape'),
  ('Dog beds',          'Dog towels')
) as v(src_label, tgt_label)
join gear_items src on src.label = v.src_label
join gear_items tgt on tgt.label = v.tgt_label
join gear_claims c on c.gear_item_id = src.id
on conflict do nothing;

-- ---- order within each section ------------------------------------------

update gear_items as g set sort = v.sort, category = v.category
from (values
  ('Shelter', 'Tents', 1), ('Shelter', 'Spare sleeping bags', 2),
  ('Shelter', 'Tarp or canopy', 3), ('Shelter', 'Ground tarps', 4),
  ('Shelter', 'Extra tent stakes', 5), ('Shelter', 'Guylines', 6),
  ('Shelter', 'Mallet', 7), ('Shelter', 'Extra camp chairs', 8),

  ('Camp Kitchen', 'Camp stove', 1), ('Camp Kitchen', 'Propane', 2),
  ('Camp Kitchen', 'Second stove', 3), ('Camp Kitchen', 'Griddle for the fire', 4),
  ('Camp Kitchen', 'Grill grate', 5), ('Camp Kitchen', 'Pots + pans', 6),
  ('Camp Kitchen', 'Cooking utensils', 7), ('Camp Kitchen', 'Cutting board', 8),
  ('Camp Kitchen', 'Sharp knife', 9), ('Camp Kitchen', 'Tongs', 10),
  ('Camp Kitchen', 'Spatula', 11), ('Camp Kitchen', 'Can opener', 12),
  ('Camp Kitchen', 'Bottle opener', 13), ('Camp Kitchen', 'Big mixing bowl', 14),
  ('Camp Kitchen', 'Spice kit', 15), ('Camp Kitchen', 'Coffee maker — press or percolator', 16),
  ('Camp Kitchen', 'Coffee filters', 17), ('Camp Kitchen', 'Cups', 18),
  ('Camp Kitchen', 'Camp table', 19), ('Camp Kitchen', 'Tablecloth + clips', 20),
  ('Camp Kitchen', 'Dish bin', 21), ('Camp Kitchen', 'Dish soap + sponges', 22),
  ('Camp Kitchen', 'Aluminum foil', 23), ('Camp Kitchen', 'Ziplock bags', 24),
  ('Camp Kitchen', 'Paper towels', 25),

  ('Coolers & Water', 'Big cooler', 1), ('Coolers & Water', 'Drinks cooler', 2),
  ('Coolers & Water', 'Ice', 3), ('Coolers & Water', 'Water jug', 4),

  ('Fire & Light', 'Firewood — buy on the island', 1),
  ('Fire & Light', 'Fire starters', 2), ('Fire & Light', 'Lighters', 3),
  ('Fire & Light', 'Hatchet', 4), ('Fire & Light', 'Roasting sticks', 5),
  ('Fire & Light', 'Water bucket for the fire', 6), ('Fire & Light', 'Fire gloves', 7),
  ('Fire & Light', 'Fire poker', 8), ('Fire & Light', 'Lanterns', 9),
  ('Fire & Light', 'Spare headlamp', 10), ('Fire & Light', 'Spare batteries', 11),

  ('Site & Safety', 'First-aid kit', 1), ('Site & Safety', 'Tick remover', 2),
  ('Site & Safety', 'Trash bags', 3), ('Site & Safety', 'Multi-tool', 4),
  ('Site & Safety', 'Duct tape', 5), ('Site & Safety', 'Food bins for the cars', 6),
  ('Site & Safety', 'Clothesline', 7), ('Site & Safety', 'Camp broom', 8),
  ('Site & Safety', 'Quarters for showers', 9),

  ('Dogs', 'Leashes', 1), ('Dogs', 'Tie-out line', 2), ('Dogs', 'Water bowls', 3),
  ('Dogs', 'Waste bags', 4), ('Dogs', 'Dog beds', 5), ('Dogs', 'Dog towels', 6)
) as v(category, label, sort)
where g.label = v.label;

-- ---- personal list: the two odd couples --------------------------------

update personal_items set label = 'Earplugs' where label = 'Earplugs + eye mask';
update personal_items set label = 'Hat' where label = 'Hat + sunglasses';

insert into personal_items (user_id, category, label, note, checked, sort, essential)
select p.id, v.category, v.label, '', false, v.sort, false
from profiles p
cross join (values
  ('Sleep', 'Eye mask', 7),
  ('Clothing', 'Sunglasses', 11)
) as v(category, label, sort)
where not exists (
  select 1 from personal_items x where x.user_id = p.id and x.label = v.label
);

drop function if exists public.personal_seed_rows();

create or replace function public.personal_seed_rows()
returns table(category text, label text, note text, sort integer, essential boolean)
language sql
immutable
set search_path = ''
as $function$
  select * from (values
    ('Sleep', 'Sleeping pad', '', 1, true),
    ('Sleep', 'Sleeping bag', 'around 55°F at night — ask Alana for a spare', 2, true),
    ('Sleep', 'Pillow', '', 3, false),
    ('Sleep', 'Tent, if you have one', '', 4, false),
    ('Sleep', 'Earplugs', '', 5, false),
    ('Sleep', 'Extra blanket', '', 6, false),
    ('Sleep', 'Eye mask', '', 7, false),
    ('Clothing', 'Warm layer', '', 1, true),
    ('Clothing', 'Rain jacket', 'rain Friday morning', 2, true),
    ('Clothing', 'Hiking shoes', '', 3, true),
    ('Clothing', 'Camp shoes', '', 4, false),
    ('Clothing', 'Socks', '', 5, false),
    ('Clothing', 'Hat', '', 6, false),
    ('Clothing', 'Long pants', '', 7, false),
    ('Clothing', 'Beanie', '', 8, false),
    ('Clothing', 'Underwear', '', 9, false),
    ('Clothing', 'Shirts + shorts for three days', '', 10, false),
    ('Clothing', 'Sunglasses', '', 11, false),
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
