-- Round 33b: the first dish anyone added had nothing to buy.
--
-- Alana used "suggest another" for breakfast sandwiches — the feature working
-- exactly as intended — but a dish added from the ballot arrives with no
-- ingredient rows, and the store list is built only from the ingredients of
-- whichever dish leads its meal. So a dish that won its slot would have put
-- nothing on the list, and the omission is invisible: no empty section, no
-- warning, just a shorter list than the menu implies.
--
-- Ingredients read straight off the name she gave it. Eggs and cheese already
-- exist for the burritos; the store list merges duplicate labels, so this adds
-- to an existing line rather than a second one.
--
-- The blind spot itself is closed in components/Food.tsx: a dish that's
-- leading its meal with no ingredients now carries a "nothing to buy" badge.

insert into shopping_items (menu_item_id, label, added_by, checked, aisle)
select mi.id, v.label, mi.added_by, false, ''
from menu_items mi
cross join (values
  ('English muffins'),
  ('Eggs'),
  ('Sliced cheese'),
  ('Breakfast sausage'),
  ('Apples'),
  ('Oranges')
) as v(label)
where mi.dish = 'Breakfast sandwiches (breakfast muffins and eggs) + fruit'
  and not exists (
    select 1 from shopping_items s
    where s.menu_item_id = mi.id and s.label = v.label
  );
