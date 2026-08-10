-- Itinerary entries become title + optional detail grouped by day part
-- (UX revision P0). Backfill maps the seeded prose into the new shape;
-- the generic fallback covers any rows edited before this shipped.

alter table itinerary_blocks add column title text not null default '';
alter table itinerary_blocks add column detail text not null default '';
alter table itinerary_blocks add column day_part text
  check (day_part in ('morning', 'afternoon', 'evening'));

-- Content pass (spec's Midday -> afternoon, Night -> evening).
update itinerary_blocks set title = 'Check in, claim both sites', detail = 'early crew · tents up first', day_part = 'morning'
  where body like 'Early crew checks in%';
update itinerary_blocks set title = 'Firewood + ice run', detail = 'buy wood on the island — no out-of-state wood', day_part = 'afternoon'
  where body like 'Firewood and ice run.%';
update itinerary_blocks set title = 'Optional: Great Head or Ocean Path', detail = 'short + close', day_part = 'afternoon'
  where body like 'Open. Great Head or Ocean Path%';
update itinerary_blocks set title = 'Late arrivals + taco night', detail = 'text the group an hour out', day_part = 'evening'
  where body like 'Late arrivals%';
update itinerary_blocks set title = 'Food sleeps in cars', detail = 'quiet hours', day_part = 'evening'
  where body like 'Quiet hours.%';
update itinerary_blocks set title = 'Beehive crew departs', detail = 'Sand Beach lot full by 8', day_part = 'morning'
  where body like 'Beehive crew out the door%';
update itinerary_blocks set title = 'Great Head with Kona', detail = 'across the cove', day_part = 'morning'
  where body like 'Chris + Kona%';
update itinerary_blocks set title = 'Regroup — camp or Jordan Pond', detail = '', day_part = 'afternoon'
  where body like 'Regroup at camp%';
update itinerary_blocks set title = 'Open', detail = 'Bar Harbor · Thunder Hole · carriage roads', day_part = 'afternoon'
  where body like 'Open. Bar Harbor%';
update itinerary_blocks set title = 'The big cook', detail = '', day_part = 'evening'
  where body like 'The big cook.%';
update itinerary_blocks set title = 'Breakfast, break camp', detail = 'trash packs out', day_part = 'morning'
  where body like 'Breakfast, break camp%';
update itinerary_blocks set title = 'Permit in the check-out box', detail = 'sweep both sites', day_part = 'morning'
  where body like 'Camping permit%';
update itinerary_blocks set title = 'Roll out', detail = 'showers arrive late day — leave early, drive dry', day_part = 'morning'
  where body like 'Showers arrive late%';

-- Fallback for rows edited before this migration shipped.
update itinerary_blocks set
  title = coalesce(nullif(split_part(body, '. ', 1), ''), body),
  detail = case
    when position('. ' in body) > 0 then substr(body, position('. ' in body) + 2)
    else ''
  end,
  day_part = case lower(time_label)
    when 'morning' then 'morning'
    when 'early' then 'morning'
    when 'checkout' then 'morning'
    when 'drive' then 'morning'
    when 'midday' then 'afternoon'
    when 'afternoon' then 'afternoon'
    when 'evening' then 'evening'
    when 'night' then 'evening'
    else null
  end
where title = '';

alter table itinerary_blocks drop column body;
alter table itinerary_blocks drop column time_label;
