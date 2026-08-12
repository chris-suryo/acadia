-- Round 13. Three of these are corrections to last round's work.

-- 1. "Put on the menu" is gone: the top-voted dish in a meal reads as leading
--    on its own, which is one less control and one less thing to forget.
alter table menu_items drop column if exists picked;

-- 2. Descriptions under each dish were noise. Kept editable, never rendered
--    in the list, so the stored text should match what's shown.
update menu_items set notes = '' where added_by is null;

-- 3. Every cooked meal needs a vegetarian main — all four dinners were meat.
alter table menu_items add column if not exists veg boolean not null default false;

insert into menu_items (night, meal, dish, notes, sort, veg)
select v.night, v.meal, v.dish, '', v.sort, true
from (values
  ('Friday','Dinner','Black bean tacos',6),
  ('Friday','Dinner','Veggie chili + cornbread',7),
  ('Saturday','Breakfast','Veggie scramble',9),
  ('Saturday','Lunch','Hummus + veg wraps',10)
) as v(night, meal, dish, sort)
where not exists (
  select 1 from menu_items m where m.dish = v.dish and m.night = v.night
);

update menu_items set veg = true
where dish in (
  'Pancakes', 'Oatmeal + fruit', 'Chips + salsa', 'Bagels + cream cheese',
  'Instant oatmeal + coffee', 'Trail mix', 'Clif bars or similar',
  'Fruit — apples, oranges', 'S''mores', 'Beer + seltzer', 'Cider'
);
