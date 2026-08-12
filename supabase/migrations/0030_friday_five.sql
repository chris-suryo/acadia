-- Round 24: the Friday dinner ballot, chosen by the person who knows the group.
--
-- Sausage + peppers comes off; fajitas and foil dinners go on, and the chili
-- gets its proper name. Foil dinners are the most camp-shaped thing here —
-- everyone builds their own packet, it goes straight in the coals, and there is
-- nothing to wash up afterwards.

delete from menu_items where dish = 'Sausage + peppers';

update menu_items set dish = 'Campfire chili' where dish = 'Chili';

insert into menu_items (night, meal, dish, notes, veg, votable, sort)
select * from (values
  ('Friday', 'Dinner', 'Fajitas', '', false, true, 2),
  ('Friday', 'Dinner', 'Foil dinners', '', false, true, 4)
) as v(night, meal, dish, notes, veg, votable, sort)
where not exists (select 1 from menu_items m where m.dish = v.dish);

update menu_items set sort = 1 where dish = 'Taco bar';
update menu_items set sort = 3 where dish = 'Burgers + dogs';
update menu_items set sort = 5 where dish = 'Campfire chili';

-- No amounts, per 0029: what to buy, not how much.
insert into shopping_items (menu_item_id, label)
select m.id, v.label
from (values
  ('Fajitas', 'Chicken thighs'),
  ('Fajitas', 'Black beans'),
  ('Fajitas', 'Bell peppers'),
  ('Fajitas', 'Onions'),
  ('Fajitas', 'Tortillas'),
  ('Fajitas', 'Fajita seasoning'),
  ('Fajitas', 'Shredded cheese'),
  ('Fajitas', 'Sour cream'),
  ('Fajitas', 'Limes'),

  ('Foil dinners', 'Kielbasa'),
  ('Foil dinners', 'Potatoes'),
  ('Foil dinners', 'Bell peppers'),
  ('Foil dinners', 'Onions'),
  ('Foil dinners', 'Carrots'),
  ('Foil dinners', 'Butter')
) as v(dish, label)
join menu_items m on m.dish = v.dish
where not exists (
  select 1 from shopping_items s
  where s.menu_item_id = m.id and s.label = v.label
);
