-- Seed content (ported from TripHubV4.jsx; mirrors lib/seeds.ts)

insert into itinerary_days (id, day_label, date_label, subtitle, sort) values
  ('fri', 'Friday', 'Aug 14', 'Arrival', 1),
  ('sat', 'Saturday', 'Aug 15', 'Hike day', 2),
  ('sun', 'Sunday', 'Aug 16', 'Pack out', 3);

insert into itinerary_blocks (day_id, time_label, body, link_slug, sort) values
  ('fri', 'Morning', 'Early crew checks in and claims both sites. Tents up first, while there''s daylight and room to work.', null, 1),
  ('fri', 'Midday', 'Firewood and ice run. Camp kitchen goes on one site; the other stays clear for tents.', null, 2),
  ('fri', 'Afternoon', 'Open. Great Head or Ocean Path for anyone restless — both are short and close.', 'great-head', 3),
  ('fri', 'Evening', 'Late arrivals — text the group an hour out. Taco dinner, fire after.', null, 4),
  ('fri', 'Night', 'Quiet hours. Food and anything scented sleeps in a car, not a tent.', null, 5),
  ('sat', 'Early', 'Beehive crew out the door early — the Sand Beach lot fills by 8.', 'beehive', 1),
  ('sat', 'Early', 'Chris + Kona on the Great Head Loop across the cove. Dogs can''t do the ladder trails.', 'great-head', 2),
  ('sat', 'Midday', 'Regroup at camp, or meet at Jordan Pond.', 'jordan-pond', 3),
  ('sat', 'Afternoon', 'Open. Bar Harbor, Thunder Hole, carriage roads — or nothing.', 'bar-harbor', 4),
  ('sat', 'Evening', 'The big cook. Everyone''s here tonight.', null, 5),
  ('sun', 'Morning', 'Breakfast, break camp, consolidate trash. Everything packs out.', null, 1),
  ('sun', 'Checkout', 'Camping permit goes in the check-out box on the way out. Sweep both sites.', null, 2),
  ('sun', 'Drive', 'Showers arrive late in the day — earlier departures get the dry drive.', null, 3);

insert into gear_items (category, label, sort) values
  ('Shelter', 'Tents — spares for first-timers (Alana)', 1),
  ('Shelter', 'Sleeping bags — spares (Alana)', 2),
  ('Shelter', 'Tarp or canopy', 3),
  ('Camp Kitchen', 'Camp stove + fuel', 1),
  ('Camp Kitchen', 'Pots, pans, cooking utensils', 2),
  ('Camp Kitchen', 'Cutting board + sharp knife', 3),
  ('Camp Kitchen', 'Big cooler + ice', 4),
  ('Camp Kitchen', 'Dish bin, soap, sponge, towel', 5),
  ('Camp Kitchen', 'Folding camp table', 6),
  ('Camp Kitchen', 'Water jug', 7),
  ('Camp Kitchen', 'Foil, ziplocks, paper towels', 8),
  ('Fire & Light', 'Firewood — buy local, don''t transport', 1),
  ('Fire & Light', 'Fire starter + lighter', 2),
  ('Fire & Light', 'Lanterns / string lights', 3),
  ('Site & Safety', 'Group first-aid kit', 1),
  ('Site & Safety', 'Trash + recycling bags', 2),
  ('Site & Safety', 'Multi-tool, duct tape, mallet', 3);

insert into menu_items (night, meal, dish, notes, sort) values
  ('Friday', 'Dinner', 'Tacos', '', 1);
