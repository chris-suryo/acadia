-- Round 31: Chirp — the trip's own Twitter.
--
-- Molida asked for a chat. During the trip this is where "summit!" photos,
-- "firewood acquired" updates, and "where is everyone?" threads go; afterward
-- it's the memory reel. The Twitter theme is the spec: 280 characters, hearts,
-- one-level replies, pins for announcements.

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  -- A reply points at its ROOT post, always — replies to replies join the
  -- same thread rather than nesting. Null means a top-level chirp.
  parent_id uuid references posts on delete cascade,
  body text not null default '' check (char_length(body) <= 280),
  -- Public storage URLs, at most four — the Twitter grid.
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  -- Anyone can pin: "we leave at 7am" is a group announcement, not a post
  -- that belongs to somebody.
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  -- A chirp says something or shows something.
  check (char_length(body) > 0 or cardinality(photos) > 0)
);

create index if not exists posts_parent_idx on posts (parent_id);

create table if not exists post_likes (
  post_id uuid not null references posts on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  -- One heart per device; the UI counts people, not devices.
  primary key (post_id, user_id)
);

alter table posts enable row level security;
alter table post_likes enable row level security;

-- Same open posture as every other table, same reasoning: eleven friends,
-- three days, no approval steps. Delete-your-own is a UI courtesy, not a
-- security boundary.
drop policy if exists "posts open" on posts;
create policy "posts open" on posts
  for all to authenticated using (true) with check (true);

drop policy if exists "post likes open" on post_likes;
create policy "post likes open" on post_likes
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table posts, post_likes;

-- Photo storage mirrors the avatars bucket (0009): public read, because
-- sharing is the point and only public URLs are cacheable by the service
-- worker for the no-signal campground. Paths are unguessable
-- posts/{uuid}/{n}.jpg. Objects are immutable — no update/delete policies;
-- a deleted post's photos are orphans, the same accepted cost as receipts.
insert into storage.buckets (id, name, public) values ('posts', 'posts', true)
on conflict (id) do nothing;

drop policy if exists "post photos read" on storage.objects;
create policy "post photos read" on storage.objects
  for select to public using (bucket_id = 'posts');

drop policy if exists "post photos insert" on storage.objects;
create policy "post photos insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'posts');
