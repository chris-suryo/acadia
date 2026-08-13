-- Round 30: a Games section on the gear list.
--
-- Eleven people, two nights, one fire — somebody has to bring the cards. Small
-- boxes that vanish into a glovebox, which is exactly why they get forgotten.

insert into gear_items (category, label, sort, essential)
select * from (values
  ('Games', 'Deck of cards', 1, false),
  ('Games', 'Uno', 2, false),
  ('Games', 'Flip 7', 3, false),
  ('Games', 'Monopoly Deal', 4, false)
) as v(category, label, sort, essential)
where not exists (select 1 from gear_items g where g.label = v.label);
