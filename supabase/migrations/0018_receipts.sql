-- Round 15: receipts on an expense, and a roster that's just the people.
--
-- One photo is the normal case and several is the Hannaford case, so receipts
-- are rows rather than a column. Storage mirrors the avatars bucket: public
-- read, authenticated write, path scoped to the expense.

create table if not exists expense_receipts (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses on delete cascade,
  url text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

alter table expense_receipts enable row level security;

-- Same reasoning as expenses: anyone can fix anyone's, because there's no
-- approval step and a wrong photo shouldn't outlive the person who added it.
drop policy if exists "receipts open" on expense_receipts;
create policy "receipts open" on expense_receipts
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table expense_receipts;

insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true)
on conflict (id) do update set public = true;

drop policy if exists "receipts read" on storage.objects;
create policy "receipts read" on storage.objects
  for select to public using (bucket_id = 'receipts');
drop policy if exists "receipts write" on storage.objects;
create policy "receipts write" on storage.objects
  for insert to authenticated with check (bucket_id = 'receipts');
drop policy if exists "receipts remove" on storage.objects;
create policy "receipts remove" on storage.objects
  for delete to authenticated using (bucket_id = 'receipts');

-- The roster was seeded from whatever names the app had seen, which included a
-- test entry. It should be the people on the trip and nothing else.
delete from expense_shares s
  using members m where s.member_id = m.id and m.name = 'poop';
update profiles set member_id = null
  where member_id in (select id from members where name = 'poop');
delete from members where name = 'poop';
