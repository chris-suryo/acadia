-- Round 19: make the menu produce a shopping list.
--
-- The Food tab asked eleven people to vote, marked a leader, and then did
-- nothing with it — the Store tab said "dishes you put on the menu bring their
-- ingredients here" and stayed empty, because not one of the twenty-seven
-- candidates had an ingredient attached. So voting changed nobody's list, and
-- whoever shops was going to arrive with nothing.
--
-- Quantities are for eleven people over three days. They're a starting point to
-- edit at the store, not gospel — but a list you trim beats a blank page.

insert into shopping_items (menu_item_id, label)
select m.id, v.label
from (values
  -- Friday dinner
  ('Tacos', 'Ground beef 4 lb'),
  ('Tacos', 'Taco seasoning ×3'),
  ('Tacos', 'Tortillas ×24'),
  ('Tacos', 'Shredded cheese 2 lb'),
  ('Tacos', 'Lettuce ×2 heads'),
  ('Tacos', 'Tomatoes ×6'),
  ('Tacos', 'Sour cream 24 oz'),
  ('Tacos', 'Salsa ×2 jars'),
  ('Tacos', 'Limes ×6'),
  ('Chili + cornbread', 'Ground beef 3 lb'),
  ('Chili + cornbread', 'Canned beans ×6'),
  ('Chili + cornbread', 'Crushed tomatoes ×4'),
  ('Chili + cornbread', 'Onions ×3'),
  ('Chili + cornbread', 'Chili powder + cumin'),
  ('Chili + cornbread', 'Cornbread mix ×3'),
  ('Chili + cornbread', 'Shredded cheese 1 lb'),
  ('Burgers + dogs', 'Burger patties ×16'),
  ('Burgers + dogs', 'Hot dogs ×24'),
  ('Burgers + dogs', 'Burger buns ×16'),
  ('Burgers + dogs', 'Hot dog buns ×24'),
  ('Burgers + dogs', 'Cheese slices ×16'),
  ('Burgers + dogs', 'Ketchup, mustard, relish'),
  ('Burgers + dogs', 'Onion ×2'),
  ('Sausage + peppers', 'Italian sausage 4 lb'),
  ('Sausage + peppers', 'Bell peppers ×8'),
  ('Sausage + peppers', 'Onions ×4'),
  ('Sausage + peppers', 'Hoagie rolls ×12'),
  ('Sausage + peppers', 'Olive oil'),
  ('Black bean tacos', 'Black beans ×6 cans'),
  ('Black bean tacos', 'Tortillas ×24'),
  ('Black bean tacos', 'Shredded cheese 1 lb'),
  ('Black bean tacos', 'Avocados ×6'),
  ('Black bean tacos', 'Limes ×6'),
  ('Black bean tacos', 'Salsa ×2 jars'),
  ('Veggie chili + cornbread', 'Mixed beans ×6 cans'),
  ('Veggie chili + cornbread', 'Crushed tomatoes ×4'),
  ('Veggie chili + cornbread', 'Onions ×3'),
  ('Veggie chili + cornbread', 'Bell peppers ×3'),
  ('Veggie chili + cornbread', 'Chili powder + cumin'),
  ('Veggie chili + cornbread', 'Cornbread mix ×3'),
  ('Chips + salsa', 'Tortilla chips ×4 bags'),
  ('Chips + salsa', 'Salsa ×3 jars'),
  -- Saturday breakfast
  ('Eggs, bacon, toast', 'Eggs ×36'),
  ('Eggs, bacon, toast', 'Bacon 3 lb'),
  ('Eggs, bacon, toast', 'Bread ×3 loaves'),
  ('Eggs, bacon, toast', 'Butter 1 lb'),
  ('Pancakes', 'Pancake mix ×2 boxes'),
  ('Pancakes', 'Maple syrup'),
  ('Pancakes', 'Butter 1 lb'),
  ('Breakfast burritos', 'Eggs ×24'),
  ('Breakfast burritos', 'Breakfast sausage 2 lb'),
  ('Breakfast burritos', 'Tortillas ×24'),
  ('Breakfast burritos', 'Shredded cheese 1 lb'),
  ('Breakfast burritos', 'Hot sauce'),
  ('Oatmeal + fruit', 'Oatmeal ×2 canisters'),
  ('Oatmeal + fruit', 'Bananas ×12'),
  ('Oatmeal + fruit', 'Berries ×2 pints'),
  ('Oatmeal + fruit', 'Brown sugar'),
  ('Veggie scramble', 'Eggs ×36'),
  ('Veggie scramble', 'Bell peppers ×3'),
  ('Veggie scramble', 'Onion ×2'),
  ('Veggie scramble', 'Mushrooms 1 lb'),
  ('Veggie scramble', 'Shredded cheese 1 lb'),
  -- Saturday lunch
  ('Sandwiches packed for the trail', 'Deli turkey 2 lb'),
  ('Sandwiches packed for the trail', 'Deli ham 2 lb'),
  ('Sandwiches packed for the trail', 'Cheese slices 1 lb'),
  ('Sandwiches packed for the trail', 'Bread ×3 loaves'),
  ('Sandwiches packed for the trail', 'Mayo + mustard'),
  ('Sandwiches packed for the trail', 'Lettuce ×1 head'),
  ('Wraps + trail mix', 'Tortillas ×24'),
  ('Wraps + trail mix', 'Deli turkey 2 lb'),
  ('Wraps + trail mix', 'Hummus ×2 tubs'),
  ('Wraps + trail mix', 'Trail mix ×3 bags'),
  ('Hummus + veg wraps', 'Hummus ×3 tubs'),
  ('Hummus + veg wraps', 'Tortillas ×24'),
  ('Hummus + veg wraps', 'Cucumbers ×3'),
  ('Hummus + veg wraps', 'Bell peppers ×3'),
  ('Hummus + veg wraps', 'Spinach ×1 bag'),
  -- Saturday snacks
  ('S''mores', 'Graham crackers ×3 boxes'),
  ('S''mores', 'Marshmallows ×3 bags'),
  ('S''mores', 'Chocolate bars ×12'),
  -- Sunday breakfast
  ('Bagels + cream cheese', 'Bagels ×24'),
  ('Bagels + cream cheese', 'Cream cheese ×3 tubs'),
  ('Leftovers scramble', 'Eggs ×24'),
  ('Instant oatmeal + coffee', 'Instant oatmeal ×2 boxes'),
  ('Instant oatmeal + coffee', 'Coffee 2 lb'),
  -- Anytime
  ('Trail mix', 'Trail mix ×4 bags'),
  ('Clif bars or similar', 'Clif bars ×24'),
  ('Fruit — apples, oranges', 'Apples ×12'),
  ('Fruit — apples, oranges', 'Oranges ×12'),
  ('Jerky', 'Beef jerky ×4 bags'),
  ('Beer + seltzer', 'Beer ×3 cases'),
  ('Beer + seltzer', 'Seltzer ×3 cases'),
  ('Cider', 'Cider ×2 six-packs')
) as v(dish, label)
join menu_items m on m.dish = v.dish
where not exists (
  select 1 from shopping_items s
  where s.menu_item_id = m.id and s.label = v.label
);
