-- Round 21: the packing list had too many words on it.
--
-- Every row was a sentence. "Bins for the food — it all goes in the cars
-- overnight" is a fine thing to know once and a terrible thing to read
-- thirty-nine times, and stacked up they turned a checklist into an essay. The
-- rows are the same rows; they just say the thing and stop.
--
-- Notes on the personal list get the same treatment. Five of them stop you
-- making an actual mistake — how cold it gets, that it rains Friday, that there
-- are no showers or outlets, that the shower is coin-op. The rest were
-- narration.

update gear_items as g set label = v.short
from (values
  ('Tents — spares for first-timers (Alana)', 'Tents — spares'),
  ('Sleeping bags — spares (Alana)', 'Sleeping bags — spares'),
  ('Ground tarps or footprints', 'Ground tarps'),
  ('Extra stakes + guylines', 'Stakes + guylines'),
  ('Pots, pans, cooking utensils', 'Pots, pans, utensils'),
  ('Cutting board + sharp knife', 'Cutting board + knife'),
  ('Dish bin, soap, sponge, towel', 'Dish bin + soap'),
  ('Folding camp table', 'Camp table'),
  ('Foil, ziplocks, paper towels', 'Foil + ziplocks'),
  ('Coffee — percolator or press, and filters', 'Coffee + filters'),
  ('Second cooler — drinks only', 'Second cooler — drinks'),
  ('Ice — restock Saturday', 'Ice'),
  ('Griddle or grill grate', 'Grill grate'),
  ('Mugs + cups for eleven', 'Mugs + cups'),
  ('Oil, salt, pepper, spice kit', 'Spice kit'),
  ('Bottle opener + corkscrew', 'Bottle opener'),
  ('Propane canisters ×2', 'Propane ×2'),
  ('Firewood — buy local, don''t transport', 'Firewood — buy on the island'),
  ('Lanterns / string lights', 'Lanterns'),
  ('Spare batteries + a backup headlamp', 'Spare batteries'),
  ('Group first-aid kit', 'First-aid kit'),
  ('Multi-tool, duct tape, mallet', 'Multi-tool + duct tape'),
  ('Tick remover + tweezers', 'Tick remover'),
  ('Bins for the food — it all goes in the cars overnight', 'Food bins for the cars'),
  ('Paracord clothesline + clips', 'Clothesline'),
  ('Camp broom + dustpan', 'Camp broom'),
  ('Quarters for the Otter Creek showers', 'Quarters for showers'),
  ('Leashes — six feet max in the park', 'Leashes'),
  ('Tie-out line for the site', 'Tie-out line'),
  ('Bed or blanket, and a towel for wet dogs', 'Dog bed + towel')
) as v(was, short)
where g.label = v.was;

update personal_items as p set label = v.short
from (values
  ('Sleeping pad or air mattress', 'Sleeping pad'),
  ('Tent, if you have your own', 'Tent, if you have one'),
  ('Warm layer — fleece or puffy', 'Warm layer'),
  ('Hiking shoes with tread', 'Hiking shoes'),
  ('Camp shoes or sandals', 'Camp shoes'),
  ('Socks — days plus one', 'Socks'),
  ('Long pants for the evening', 'Long pants'),
  ('Plate, bowl, cup, utensils', 'Plate, bowl, utensils'),
  ('Headlamp or flashlight', 'Headlamp'),
  ('Park pass, or card for the gate', 'Park pass or card'),
  ('Offline maps downloaded', 'Offline maps'),
  ('Daypack for the hikes', 'Daypack'),
  ('Wet wipes / hand sanitizer', 'Wet wipes'),
  ('Quick-dry towel', 'Towel'),
  ('Flip-flops for the showers', 'Shower flip-flops'),
  ('Lip balm with SPF', 'Lip balm'),
  ('Dry bag or a ziplock for your phone', 'Dry bag for your phone'),
  ('Trekking poles, if you use them', 'Trekking poles')
) as v(was, short)
where p.label = v.was;

-- Five notes survive, and shorter. Everything else loses its subtitle.
update personal_items set note = '';
update personal_items as p set note = v.note
from (values
  ('Sleeping bag', 'around 55°F at night — ask Alana for a spare'),
  ('Rain jacket', 'rain Friday morning'),
  ('Portable charger', 'no outlets at camp'),
  ('Wet wipes', 'no showers at Blackwoods'),
  ('Cash + quarters', 'the showers are coin-op')
) as v(label, note)
where p.label = v.label;

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
