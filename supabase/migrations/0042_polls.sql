-- Round 35: polls on the feed.
--
-- This group votes. The menu ballot worked — five people picked the taco bar
-- inside a day — but it can only ask the questions the menu knows about, and
-- the ones that matter at camp arrive unplanned: beach or hike, leave at seven
-- or eight, Thirsty Whale or Side Street. A poll is a chirp that asks one.
--
-- Options ride on the post rather than in their own table: they're a fixed,
-- ordered, at-most-four list that is never edited after posting, so a column
-- says exactly that and a join would only imply otherwise.

alter table posts add column if not exists poll_options text[] not null default '{}';

alter table posts drop constraint if exists posts_poll_options_check;
alter table posts add constraint posts_poll_options_check
  check (cardinality(poll_options) = 0 or cardinality(poll_options) between 2 and 4);

-- One vote per device, changeable — the primary key makes changing your mind
-- an upsert rather than a duplicate. Counted per person in the UI, like every
-- other tally here, so a Home Screen install isn't a second ballot.
create table if not exists post_poll_votes (
  post_id uuid not null references posts on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  choice int not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table post_poll_votes enable row level security;

drop policy if exists "poll votes open" on post_poll_votes;
create policy "poll votes open" on post_poll_votes
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table post_poll_votes;
