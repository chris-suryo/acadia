-- Round 32: Jessie makes twelve.
--
-- She's coming Friday. The roster is alphabetical, so she slots between Irene
-- and Mayank and everyone after her shifts down one — appending her at the end
-- would have put her out of order in the one list eleven people scan to find
-- their own name.
--
-- Sort order is load-bearing beyond display: shares() hands out the odd cents
-- in roster order. Nothing has been settled yet, so the only effect is which
-- person carries an extra penny on the two campsite rows.
--
-- Twelve is also exactly the cap: the park allows six people per site and we
-- have two. There is no room for a thirteenth without a third site.

insert into members (name, sort)
select 'Jessie', 8
where not exists (select 1 from members where name = 'Jessie');

update members set sort = sort + 1
where name in ('Mayank', 'Molida', 'Patrick', 'Sng');

-- The table for Saturday dinner is one bigger. This is the same detail line
-- migration 0025 walked from twelve down to eleven.
update itinerary_blocks set detail = 'call ahead for 12'
  where detail = 'call ahead for 11';
