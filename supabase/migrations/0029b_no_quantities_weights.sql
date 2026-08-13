-- Round 23b: the weights 0029 missed.
--
-- Recovered from the deployed database rather than written fresh. This ran
-- against production the day 0029 dropped quantities and was never committed,
-- so for a while the repo replayed into a database that differed from the real
-- one — the exact trap a migrations directory exists to prevent. The SQL below
-- is verbatim from `supabase_migrations.schema_migrations.statements`.
--
-- Why it was needed: 0029 stripped counts like "×4 bags" but not trailing
-- weights like "2 lbs", because its regex used \b for a word boundary. In
-- Postgres \b is a backspace character, not a boundary, so that half of the
-- pattern silently matched nothing. Anchoring on \s and the unit fixed it.

update shopping_items
set label = btrim(regexp_replace(label, '\s+\d+(\.\d+)?\s*(lbs?|ozs?|qt|gal|kg|g)\s*$', '', 'i'))
where label ~* '\s\d+(\.\d+)?\s*(lbs?|ozs?|qt|gal|kg|g)\s*$';

-- Stripping the weight can collide two rows into the same label; keep one.
delete from shopping_items a
using shopping_items b
where a.menu_item_id is not distinct from b.menu_item_id
  and a.label = b.label
  and a.ctid > b.ctid;
