-- Round 15b: the actual guest list.
--
-- Chris knows who's coming, so nobody should have to type their own name into a
-- text box and hope it matches what everyone else typed. The roster is the whole
-- party; opening the app is a matter of tapping which one you are.
--
-- Alphabetical, because a picker is scanned rather than read.
--
-- Erin's row already exists with the name she chose on her own phone, and it
-- carries her device link — matching on name leaves it exactly as it is rather
-- than creating a second Erin.

insert into members (name, sort)
select v.name, v.sort
from (values
  ('Alana', 1),
  ('Alexis', 2),
  ('Ariana', 3),
  ('Ashley', 4),
  ('Chris', 5),
  ('Erin', 6),
  ('Irene', 7),
  ('Mayank', 8),
  ('Molida', 9),
  ('Patrick', 10),
  ('Sng', 11)
) as v(name, sort)
where not exists (
  -- `Erin 🍀` starts with `Erin`, so she matches and isn't duplicated.
  select 1 from members m
  where lower(m.name) = lower(v.name)
     or lower(m.name) like lower(v.name) || ' %'
);

-- Re-sort everyone alphabetically, including the rows that were already here.
update members m set sort = r.rn
from (select id, row_number() over (order by lower(name)) as rn from members) r
where r.id = m.id;
