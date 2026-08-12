-- Round 23: say the thing, not the amount.
--
-- "Lettuce ×2 heads", "Ground beef 4 lb", "Salsa ×6 jars" — every line on the
-- shopping list carried a quantity nobody had actually worked out, invented by
-- me from a party size. Standing in the aisle you either trust a number you
-- shouldn't or do the arithmetic anyway, and either way the number is noise.
-- The packing list never told you how many socks to bring; this shouldn't
-- either. It says what to buy, and you decide how much.
--
-- Stripping the quantity also collapses lines that were only ever apart
-- because of it: "Cheese slices 1 lb" and "Cheese slices ×24" are one line now,
-- as are the two lettuces and the three salsas.

-- Two passes, because the two ways a quantity gets written don't overlap.
-- Note \s*$ rather than a word boundary: Postgres spells that \y, and \b here
-- means a literal backspace — which is why the weights survived the first run.
update shopping_items
set label = btrim(regexp_replace(label, '\s*[×x]\s*\d+.*$', ''))
where label ~ '[×x]\s*\d';

update shopping_items
set label = btrim(regexp_replace(label, '\s+\d+(\.\d+)?\s*(lbs?|ozs?|qt|gal|kg|g)\s*$', '', 'i'))
where label ~* '\s\d+(\.\d+)?\s*(lbs?|ozs?|qt|gal|kg|g)\s*$';

-- Stripping can leave a dish holding the same line twice ("Salsa ×2 jars" and
-- "Salsa ×1 jar" both become "Salsa"). Keep the oldest of each.
delete from shopping_items a
using shopping_items b
where a.menu_item_id is not distinct from b.menu_item_id
  and a.label = b.label
  and a.ctid > b.ctid;

-- Where a line was added decides where it shows, rather than what the
-- classifier guesses from the words. Someone who taps "Add" under Produce and
-- types "bananas" gets it under Produce; empty means guess, as before.
alter table shopping_items add column if not exists aisle text not null default '';
