-- The real trip skeleton, dictated by Chris after the phone rounds: staggered
-- Friday arrivals + camp night, Saturday in the park with dinner in Bar
-- Harbor, Sunday pack-out. Replaces the seed placeholders wholesale (the
-- only live edit was a day_part drag during testing).

update itinerary_days set subtitle = 'Park day' where id = 'sat';

delete from itinerary_blocks;

insert into itinerary_blocks (day_id, title, detail, day_part, link_slug, sort) values
  ('fri', 'Rolling in all day', 'arrivals staggered — text the thread an hour out', null, null, 1),
  ('fri', 'Claim the sites, tents up', 'first crew sets the kitchen', 'afternoon', null, 2),
  ('fri', 'Firewood + ice run', 'buy wood on the island — no out-of-state wood', 'afternoon', null, 3),
  ('fri', 'Taco night at camp', 'we cook Friday', 'evening', null, 4),
  ('fri', 'Campfire, stay in', 'food sleeps in cars · quiet hours at 10', 'evening', null, 5),
  ('sat', 'Into the park', 'passes sorted at the gate', 'morning', null, 1),
  ('sat', 'Shuttle or cars — call it at breakfast', 'Route 10 stops at the campground', 'morning', 'shuttle', 2),
  ('sat', 'Out in the park all day', 'Beehive · Ocean Path · Jordan Pond · Echo Lake', 'afternoon', 'beehive', 3),
  ('sat', 'Dinner in Bar Harbor', 'call ahead — nobody reserves for 12', 'evening', 'bar-harbor', 4),
  ('sun', 'Breakfast, break camp', 'trash packs out', 'morning', null, 1),
  ('sun', 'Permit in the check-out box', 'sweep both sites', 'morning', null, 2),
  ('sun', 'Roll out', 'checkout is 11 am', 'morning', null, 3);
