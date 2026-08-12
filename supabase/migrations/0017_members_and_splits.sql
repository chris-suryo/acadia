-- Round 14: expenses that do the math.
--
-- Splitting a bill needs a stable list of people, and `profiles` cannot be one:
-- its primary key references auth.users, so a person who has never opened the
-- app can't have a row, and a person who opens it on a phone and a laptop gets
-- two. The live table proves both halves — three separate "Chris" rows and
-- nobody else from the twelve.
--
-- So the roster gets its own id space, and a profile points at whichever member
-- it belongs to.

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

alter table members enable row level security;

-- Shared like gear and shopping: it's a dozen friends, not an org chart.
drop policy if exists "members open" on members;
create policy "members open" on members
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table members;

-- Seed from the names the app has actually seen, so the backfill below matches
-- exactly, plus Alana — she's all over the gear list as the person bringing
-- spares, and she'll be splitting bills whether or not she's opened the app.
insert into members (name, sort)
select name, row_number() over (order by name)
from (
  select distinct trim(name) as name from profiles where trim(name) <> ''
  union
  select 'Alana'
) n
where not exists (
  select 1 from members m where lower(m.name) = lower(n.name)
);

alter table profiles
  add column if not exists member_id uuid references members on delete set null;

-- Collapse the duplicate devices: every profile that typed the same name is the
-- same human, and from here on the app resolves identity through this column.
update profiles p
set member_id = m.id
from members m
where p.member_id is null
  and lower(trim(p.name)) = lower(m.name);

-- Expenses gain a payer and a set of people it was for. `user_id` stays as who
-- typed the row in — usually the payer, but "I'm logging what Alana paid at the
-- store" has to be expressible, and the row credits the payer either way.
alter table expenses
  add column if not exists payer_id uuid references members on delete restrict;

create table if not exists expense_shares (
  expense_id uuid not null references expenses on delete cascade,
  member_id uuid not null references members on delete restrict,
  primary key (expense_id, member_id)
);

alter table expense_shares enable row level security;

drop policy if exists "shares open" on expense_shares;
create policy "shares open" on expense_shares
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table expense_shares;

-- Anyone can fix anyone's expense. The old own-rows-only policies meant a typo
-- in someone else's total was permanent unless they fixed it themselves, and
-- there's no approval step here to justify that.
drop policy if exists "expenses insert own" on expenses;
drop policy if exists "expenses update own" on expenses;
drop policy if exists "expenses delete own" on expenses;
drop policy if exists "expenses read" on expenses;
drop policy if exists "expenses open" on expenses;
create policy "expenses open" on expenses
  for all to authenticated using (true) with check (true);
