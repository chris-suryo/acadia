-- Round 22: a menu you can actually cook at a campsite.
--
-- The ballot had pizza on it, and toast, and cornbread. None of those happen at
-- Blackwoods: no oven, no toaster, and — the constraint that matters most — one
-- portable burner plus a grate over the fire. Two pans at once is already a
-- stretch, so every option here is one pan or the fire.
--
-- And the vegetarian split is gone. Rather than a separate veg dish competing
-- with the meat ones, every dish is built vegetarian and the meat is cooked
-- apart and added at the end. One pot, everyone eats the same meal, and the
-- ballot stops asking people to pick a side.

-- --- the ballot ------------------------------------------------------------

delete from menu_items where dish in (
  'Pizza',                     -- no oven
  'Eggs, bacon, toast',        -- no toaster
  'Veggie chili + cornbread'   -- no oven, and chili is meat-optional now
);

-- Renames keep their row id, so any vote already cast survives.
update menu_items set dish = 'Taco bar' where dish = 'Tacos';
update menu_items set dish = 'Pancakes + bacon' where dish = 'Pancakes';

insert into menu_items (night, meal, dish, notes, veg, votable, sort)
select * from (values
  ('Friday', 'Dinner', 'Chili', '', false, true, 3),
  ('Friday', 'Dinner', 'Sausage + peppers', '', false, true, 4),
  ('Saturday', 'Breakfast', 'Oatmeal + fruit', '', false, true, 2)
) as v(night, meal, dish, notes, veg, votable, sort)
where not exists (select 1 from menu_items m where m.dish = v.dish);

update menu_items set sort = 1 where dish = 'Taco bar';
update menu_items set sort = 2 where dish = 'Burgers + dogs';
update menu_items set sort = 1 where dish = 'Breakfast burritos';
update menu_items set sort = 3 where dish = 'Pancakes + bacon';

-- --- what each one actually needs ------------------------------------------
-- Rewritten wholesale: the quantities were for a different menu, and the
-- vegetarian base is new on every dish that used to be meat-only.

delete from shopping_items where menu_item_id in (
  select id from menu_items where dish in (
    'Taco bar', 'Burgers + dogs', 'Chili', 'Sausage + peppers',
    'Breakfast burritos', 'Oatmeal + fruit', 'Pancakes + bacon',
    'Sandwiches packed for the trail'
  )
);

insert into shopping_items (menu_item_id, label)
select m.id, v.label
from (values
  -- Beans are the base; the beef is browned in the pan on the grate.
  ('Taco bar', 'Black beans ×8 cans'),
  ('Taco bar', 'Ground beef 4 lb'),
  ('Taco bar', 'Taco seasoning ×3'),
  ('Taco bar', 'Tortillas ×36'),
  ('Taco bar', 'Shredded cheese 2 lb'),
  ('Taco bar', 'Lettuce ×2 heads'),
  ('Taco bar', 'Tomatoes ×6'),
  ('Taco bar', 'Sour cream 24 oz'),
  ('Taco bar', 'Salsa ×2 jars'),
  ('Taco bar', 'Limes ×6'),

  ('Burgers + dogs', 'Burger patties ×16'),
  ('Burgers + dogs', 'Veggie burgers ×8'),
  ('Burgers + dogs', 'Hot dogs ×24'),
  ('Burgers + dogs', 'Burger buns ×24'),
  ('Burgers + dogs', 'Hot dog buns ×24'),
  ('Burgers + dogs', 'Cheese slices ×24'),
  ('Burgers + dogs', 'Ketchup, mustard, relish'),
  ('Burgers + dogs', 'Onion ×2'),
  ('Burgers + dogs', 'Lettuce ×1 head'),
  ('Burgers + dogs', 'Tomatoes ×3'),

  -- Fritos rather than cornbread — cornbread wanted an oven.
  ('Chili', 'Canned beans ×8'),
  ('Chili', 'Crushed tomatoes ×4'),
  ('Chili', 'Ground beef 3 lb'),
  ('Chili', 'Onions ×3'),
  ('Chili', 'Bell peppers ×3'),
  ('Chili', 'Chili powder + cumin'),
  ('Chili', 'Shredded cheese 1 lb'),
  ('Chili', 'Sour cream 24 oz'),
  ('Chili', 'Fritos ×2 bags'),

  ('Sausage + peppers', 'Italian sausage 4 lb'),
  ('Sausage + peppers', 'Veggie sausage ×8'),
  ('Sausage + peppers', 'Bell peppers ×8'),
  ('Sausage + peppers', 'Onions ×4'),
  ('Sausage + peppers', 'Hoagie rolls ×12'),
  ('Sausage + peppers', 'Olive oil'),

  ('Breakfast burritos', 'Eggs ×36'),
  ('Breakfast burritos', 'Breakfast sausage 2 lb'),
  ('Breakfast burritos', 'Tortillas ×24'),
  ('Breakfast burritos', 'Shredded cheese 1 lb'),
  ('Breakfast burritos', 'Salsa ×1 jar'),
  ('Breakfast burritos', 'Hot sauce'),

  ('Oatmeal + fruit', 'Instant oatmeal ×2 boxes'),
  ('Oatmeal + fruit', 'Bananas ×12'),
  ('Oatmeal + fruit', 'Berries ×2 pints'),
  ('Oatmeal + fruit', 'Brown sugar'),

  ('Pancakes + bacon', 'Pancake mix ×2 boxes'),
  ('Pancakes + bacon', 'Maple syrup'),
  ('Pancakes + bacon', 'Butter 1 lb'),
  ('Pancakes + bacon', 'Bacon 3 lb'),

  -- Hummus so the trail lunch works for everyone too.
  ('Sandwiches packed for the trail', 'Deli turkey 2 lb'),
  ('Sandwiches packed for the trail', 'Deli ham 2 lb'),
  ('Sandwiches packed for the trail', 'Hummus ×3 tubs'),
  ('Sandwiches packed for the trail', 'Cheese slices 1 lb'),
  ('Sandwiches packed for the trail', 'Bread ×3 loaves'),
  ('Sandwiches packed for the trail', 'Mayo + mustard'),
  ('Sandwiches packed for the trail', 'Lettuce ×1 head')
) as v(dish, label)
join menu_items m on m.dish = v.dish;

-- --- the two bits of kit the menu now depends on ---------------------------
-- One burner for eleven people is the real bottleneck of the weekend, and
-- pancakes on it is about eight rounds. A flat griddle over the fire turns
-- that into two, and a second burner takes the pressure off every dish.

insert into gear_items (category, label, sort, essential)
select * from (values
  ('Camp Kitchen', 'Flat griddle for the fire', 16, true),
  ('Camp Kitchen', 'Second stove or burner', 17, true)
) as v(category, label, sort, essential)
where not exists (select 1 from gear_items g where g.label = v.label);
