-- Round 34: one heart wasn't enough.
--
-- Six chirps in the first fifteen minutes drew six hearts, which is a lot of
-- appetite for a single verb. A reaction becomes (post, person, emoji) rather
-- than (post, person), so one person can be both delighted and amused by the
-- same photo.
--
-- Every existing row defaults to ❤️, so nothing anyone has already tapped is
-- lost and the plain heart keeps behaving exactly as it did. Rehearsed against
-- the live table inside a rolled-back transaction first: seven hearts in,
-- seven hearts out, all of them ❤️.

alter table post_likes add column if not exists emoji text not null default '❤️';

alter table post_likes drop constraint if exists post_likes_pkey;
alter table post_likes add primary key (post_id, user_id, emoji);
