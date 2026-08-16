-- Round 38: who rode, not just how many ways.
--
-- Gas and parking were split twelve ways because twelve ways was the split the
-- picker made easy — but only some people were in each car, so two real costs
-- were charged to people who weren't there. The mechanism to fix it already
-- existed: expense_shares is rows, not a count, so any subset has always been
-- expressible. What was missing was a way to pick a subset once and reuse it.
--
-- A group is a named set of members and nothing more. It holds no money, and
-- nothing references it: applying one writes ordinary expense_shares rows, so
-- an expense keeps the split it was given even if the group is later renamed
-- or deleted. That's deliberate — a settled ledger shouldn't change because
-- somebody tidied up a label.

create table if not exists split_groups (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  -- Plain uuids rather than a join table: this is a scratch list for the
  -- picker, not a relation anybody reads through. Members removed from the
  -- roster simply stop matching, which is the behaviour we want.
  member_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table split_groups enable row level security;

-- Same posture as the rest of the shared trip tables — see the README's
-- Security section before copying this anywhere.
drop policy if exists "split groups open" on split_groups;
create policy "split groups open" on split_groups
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table split_groups;

-- Boot enumerates its tables explicitly, so a new one that isn't listed here
-- arrives empty on first paint and only fills in on the next realtime event —
-- which looks exactly like a bug and isn't one. Same list, one line longer.
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
    'split_groups',    (select coalesce(json_agg(t), '[]'::json) from public.split_groups t),
    'survey',          (select coalesce(json_agg(t), '[]'::json) from public.survey t),
    'forecast_cache',  (select coalesce(json_agg(t), '[]'::json) from public.forecast_cache t),
    'posts',           (select coalesce(json_agg(t), '[]'::json) from public.posts t),
    'post_likes',      (select coalesce(json_agg(t), '[]'::json) from public.post_likes t),
    'post_poll_votes', (select coalesce(json_agg(t), '[]'::json) from public.post_poll_votes t)
  );
$fn$;
