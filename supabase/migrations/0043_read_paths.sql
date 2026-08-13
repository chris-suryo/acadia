-- Round 36: stop reading twelve hundred rows to find forty-three.
--
-- personal_items is the one table that grows with devices rather than with the
-- trip: 43 rows per phone, 29 phones, 1,248 rows. Every app open and every
-- foreground resume read it, and with no index on user_id that meant a
-- sequential scan that discarded 1,205 rows to return 43.
--
-- Worse, the policy read `user_id = auth.uid()`, which Postgres re-evaluates
-- per row — 1,248 calls to a function whose answer never changes inside one
-- query. Wrapping it in a scalar subselect makes it one call. Same rule, same
-- rows, one evaluation.
--
-- Measured on the live table before and after: seq scan touching 17 buffers
-- and throwing away 1,205 rows, versus a bitmap index scan touching 5 and
-- throwing away none.

create index if not exists personal_items_user_idx on personal_items (user_id);

drop policy if exists "personal own" on personal_items;
create policy "personal own" on personal_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The same per-row re-evaluation on the small tables. They're cheap today, but
-- it's the identical one-line correction and it clears the warning for good.
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles
  for update to authenticated using (id = (select auth.uid()));

drop policy if exists "survey update own" on survey;
create policy "survey update own" on survey
  for update to authenticated using (user_id = (select auth.uid()));

drop policy if exists "votes delete own" on menu_votes;
create policy "votes delete own" on menu_votes
  for delete to authenticated using (user_id = (select auth.uid()));

analyze personal_items;
