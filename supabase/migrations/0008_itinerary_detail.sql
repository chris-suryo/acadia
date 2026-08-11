-- Chris's fuller arrival/park-day story, now with the booked sites
-- (B080 + B082). Live rows matched the 0007 seed exactly (no user edits),
-- so wholesale replacement is safe again.

delete from itinerary_blocks;

insert into itinerary_blocks (day_id, title, detail, day_part, link_slug, sort) values
  ('fri', 'Rolling in all day', 'arrivals staggered — text the thread an hour out', null, null, 1),
  ('fri', 'Check in — sites B080 + B082', 'side by side on the B loop', 'afternoon', null, 2),
  ('fri', 'Camp setup', 'tents, kitchen, tarp — first crew starts', 'afternoon', null, 3),
  ('fri', 'Firewood, ice, water', 'wood on the island only · spigots at camp for refills', 'afternoon', null, 4),
  ('fri', 'Taco night at camp', 'we cook Friday', 'evening', null, 5),
  ('fri', 'Campfire + plan Saturday', 'food sleeps in cars · quiet hours at 10', 'evening', null, 6),
  ('sat', 'Breakfast, pick the plan', 'which hikes, who''s going where', 'morning', null, 1),
  ('sat', 'Shuttle or cars', 'Route 10 stops at the campground', 'morning', 'shuttle', 2),
  ('sat', 'Out in the park', 'pick from the options below', 'afternoon', 'beehive', 3),
  ('sat', 'Dinner in Bar Harbor', 'call ahead — nobody reserves for 12', 'evening', 'bar-harbor', 4),
  ('sun', 'Breakfast, break camp', 'trash packs out', 'morning', null, 1),
  ('sun', 'Permit in the check-out box', 'sweep both sites', 'morning', null, 2),
  ('sun', 'Roll out', 'checkout is 11 am', 'morning', null, 3);
