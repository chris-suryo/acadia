-- Wipe the testing, keep the trip.
--
-- Run this once, immediately before sending the link to everyone. It clears
-- everything that was entered while building — votes, ticks, claims, money,
-- ideas, and the device rows from testing phones — and leaves the content the
-- app is *for*: the schedule, the roster, the menu, the gear list, the
-- ingredients.
--
-- Not a migration. It is destructive on purpose and is never run automatically.
-- Paste it into the Supabase SQL editor when you're ready.

begin;

-- Money. Nothing has been spent yet, and a stray test expense would put
-- someone in debt on day one.
delete from expense_shares;
delete from expense_receipts;
delete from settlements;
delete from expenses;

-- Votes, so the ballot opens genuinely empty and the first real vote decides
-- the meal rather than tying with a test one.
delete from menu_votes;

-- Anything added to the shopping list by hand. Dish ingredients stay: they are
-- the menu's own content, not test data.
delete from shopping_items where menu_item_id is null;
update shopping_items set checked = false, checked_by = null;

-- Group gear goes back to unclaimed. Claims are their own rows now, and they
-- cascade off profiles anyway — this just makes the order explicit.
delete from gear_claims;

-- Personal packing lists are per-device and get re-seeded on first sign-in, so
-- the rows belonging to test devices are just noise.
delete from personal_items;

-- What people said they wanted.
delete from survey;

-- The device rows themselves, last, since other tables reference them. Members
-- survive — the roster is the twelve people, not their phones — and clearing
-- profiles unclaims every name so everyone picks their own on first open.
update members set venmo = '' where venmo <> '';
delete from profiles;

commit;

-- Sanity check afterwards. Expect: 11 members, 0 profiles, 0 votes,
-- 0 claimed gear, and a menu and ingredient list that are still intact.
select
  (select count(*) from members)                                as members,
  (select count(*) from profiles)                               as devices,
  (select count(*) from menu_votes)                             as votes,
  (select count(*) from menu_items)                             as dishes,
  (select count(*) from shopping_items)                         as list_lines,
  (select count(*) from gear_items)                             as gear,
  (select count(*) from gear_claims)                             as gear_claimed,
  (select count(*) from expenses)                               as expenses;
