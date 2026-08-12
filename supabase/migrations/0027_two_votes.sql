-- Round 21: two votes, not nine.
--
-- Twenty-seven dishes across nine meal slots asked eleven people to hold an
-- opinion about Sunday's oatmeal. Almost nobody did — one vote in three days —
-- and the sprawl was the reason: a ballot that long doesn't read as a question,
-- it reads as a menu to browse.
--
-- Two meals actually get cooked and argued about: Friday dinner and Saturday
-- breakfast. Those keep their options and their votes. Saturday dinner is out
-- in Bar Harbor, and the trail lunch, Sunday breakfast, snacks and drinks are
-- things you just buy — they stay on the shopping list and stop being
-- questions.

alter table menu_items add column if not exists votable boolean not null default false;

update menu_items set votable = true
where (night, meal) in (('Friday', 'Dinner'), ('Saturday', 'Breakfast'));

-- Coffee arrived attached to a Sunday option nobody is voting on any more. It
-- is not optional; it moves to the breakfast that's actually being bought.
insert into shopping_items (menu_item_id, label)
select m.id, 'Coffee 2 lb' from menu_items m
where m.dish = 'Bagels + cream cheese'
  and not exists (
    select 1 from shopping_items s
    where s.menu_item_id = m.id and s.label = 'Coffee 2 lb'
  );

-- Ingredients and votes cascade, so this is the whole cut.
delete from menu_items where dish in (
  'Chili + cornbread',
  'Sausage + peppers',
  'Black bean tacos',
  'Oatmeal + fruit',
  'Veggie scramble',
  'Leftovers scramble',
  'Instant oatmeal + coffee',
  'Wraps + trail mix',
  'Hummus + veg wraps',
  'Out in Bar Harbor',
  'Clif bars or similar',
  'Jerky',
  'Cider'
);
