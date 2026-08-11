-- Copy pass: the plan was carrying detail lines nobody needs to read twice.
-- Facts that belong to a moment move onto that moment (check-in time onto
-- Friday's check-in; checkout already lives on Sunday's roll out), the camp
-- card keeps only the site numbers, and Saturday morning splits into the two
-- things that actually happen: cook, then pick.
--
-- Live rows matched the 0008 seed exactly (no user edits), so replacement is
-- safe.

delete from itinerary_blocks;

insert into itinerary_blocks (day_id, title, detail, day_part, link_slug, sort) values
  ('fri', 'Rolling in all day', '', null, null, 1),
  ('fri', 'Check in', 'from 1 pm', 'afternoon', null, 2),
  ('fri', 'Camp setup', 'tents, kitchen, tarp', 'afternoon', null, 3),
  ('fri', 'Firewood, ice, water', 'buy wood on the island', 'afternoon', null, 4),
  ('fri', 'Cook dinner at camp', '', 'evening', null, 5),
  ('fri', 'Campfire, plan Saturday', 'food in the cars overnight', 'evening', null, 6),
  ('sat', 'Cook breakfast', '', 'morning', null, 1),
  ('sat', 'Pick the hikes', 'who''s going where', 'morning', null, 2),
  ('sat', 'Shuttle or cars', '', 'morning', 'shuttle', 3),
  ('sat', 'Out in the park', '', 'afternoon', 'beehive', 4),
  ('sat', 'Dinner in Bar Harbor', 'call ahead for 12', 'evening', 'bar-harbor', 5),
  ('sun', 'Breakfast, break camp', 'trash packs out', 'morning', null, 1),
  ('sun', 'Permit in the check-out box', 'sweep both sites', 'morning', null, 2),
  ('sun', 'Roll out', 'checkout is 11 am', 'morning', null, 3);
