-- Round 28: two people can both have a tent.
--
-- `gear_items.owner_id` allowed exactly one claimer, so the second person with
-- a tent had nowhere to say so — and worse, the row already looked handled, so
-- nobody asked. That's a real hole in a list whose whole job is telling eleven
-- people who is bringing what.
--
-- Claims become their own table. Existing owners carry over unchanged, and
-- `owner_id` goes rather than lingering as a second, staler answer to the same
-- question.

create table if not exists gear_claims (
  gear_item_id uuid not null references gear_items on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (gear_item_id, user_id)
);

insert into gear_claims (gear_item_id, user_id)
select id, owner_id from gear_items where owner_id is not null
on conflict do nothing;

alter table gear_claims enable row level security;

-- Same posture as the rest of the shared tables, and the same reasoning: no
-- approval step, and a claim entered by mistake shouldn't need its author to
-- undo it. The primary key already stops anyone claiming twice.
drop policy if exists "gear claims open" on gear_claims;
create policy "gear claims open" on gear_claims
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table gear_claims;

alter table gear_items drop column if exists owner_id;
