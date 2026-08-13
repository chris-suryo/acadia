-- Round 37: one round trip to open the app.
--
-- Boot fired eighteen `select *` calls before anything was usable. At a
-- picnic table on one bar that is the slowest moment in the app, and it is
-- the moment the app most needs to survive. This returns the same eighteen
-- tables in one call.
--
-- `security invoker` is the load-bearing word. Under `definer` this would run
-- as the owner and hand every phone all 1,248 personal_items rows — everyone's
-- private packing list. As invoker the caller's own RLS still applies, so
-- personal_items comes back scoped to the caller: verified at 43 rows, not
-- 1,248, before this shipped.
--
-- `stable` lets the planner treat it as read-only. The empty search_path with
-- fully-qualified names is the project habit for functions (see 0033).

create or replace function public.trip_snapshot()
returns json
language sql
stable
security invoker
set search_path = ''
as $fn$
  select json_build_object(
    'profiles',        (select coalesce(json_agg(t), '[]'::json) from public.profiles t),
    'members',         (select coalesce(json_agg(t), '[]'::json) from public.members t),
    'itinerary_days',  (select coalesce(json_agg(t), '[]'::json) from public.itinerary_days t),
    'itinerary_blocks',(select coalesce(json_agg(t), '[]'::json) from public.itinerary_blocks t),
    'gear_items',      (select coalesce(json_agg(t), '[]'::json) from public.gear_items t),
    'gear_claims',     (select coalesce(json_agg(t), '[]'::json) from public.gear_claims t),
    'personal_items',  (select coalesce(json_agg(t), '[]'::json) from public.personal_items t),
    'menu_items',      (select coalesce(json_agg(t), '[]'::json) from public.menu_items t),
    'menu_votes',      (select coalesce(json_agg(t), '[]'::json) from public.menu_votes t),
    'shopping_items',  (select coalesce(json_agg(t), '[]'::json) from public.shopping_items t),
    'expenses',        (select coalesce(json_agg(t), '[]'::json) from public.expenses t),
    'expense_shares',  (select coalesce(json_agg(t), '[]'::json) from public.expense_shares t),
    'expense_receipts',(select coalesce(json_agg(t), '[]'::json) from public.expense_receipts t),
    'settlements',     (select coalesce(json_agg(t), '[]'::json) from public.settlements t),
    'survey',          (select coalesce(json_agg(t), '[]'::json) from public.survey t),
    'forecast_cache',  (select coalesce(json_agg(t), '[]'::json) from public.forecast_cache t),
    'posts',           (select coalesce(json_agg(t), '[]'::json) from public.posts t),
    'post_likes',      (select coalesce(json_agg(t), '[]'::json) from public.post_likes t),
    'post_poll_votes', (select coalesce(json_agg(t), '[]'::json) from public.post_poll_votes t)
  );
$fn$;

-- The seeder never needed elevated rights. It inserts rows for auth.uid() and
-- nothing else, which the table's own `with check` already permits, so running
-- as the caller is both sufficient and one less way to get this wrong. The
-- security advisor flagged it as a definer function any signed-in user could
-- call; now there is nothing to flag.
create or replace function public.seed_personal_items()
returns void
language plpgsql
security invoker
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  insert into personal_items (user_id, category, label, note, checked, sort, essential)
  select auth.uid(), s.category, s.label, s.note, false, s.sort, s.essential
  from personal_seed_rows() s
  where not exists (
    select 1 from personal_items p where p.user_id = auth.uid()
  );
end;
$function$;
