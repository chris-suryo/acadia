-- Round 33: Jessie joins the expenses she's actually part of.
--
-- Adding her to the roster made her a person on the trip but not a person on
-- the bill: both campsite rows were still split eleven ways, so she'd have
-- slept at a site she wasn't paying for. Shares are rows, not a count, so a
-- new member is never retroactive on her own — which is right for a burrito
-- somebody bought before she arrived, and wrong for the site itself.
--
-- Scoped deliberately to the two campsite rows. Nothing has been settled, so
-- this only changes what the settle-up proposes, not anything already paid.
-- $30 over twelve is $2.50 exactly, so the odd-cent path doesn't even run.

insert into expense_shares (expense_id, member_id)
select e.id, m.id
from expenses e
cross join members m
where m.name = 'Jessie'
  and e.description in ('1/2 site', 'Camp site (1 night)')
  and not exists (
    select 1 from expense_shares s
    where s.expense_id = e.id and s.member_id = m.id
  );
