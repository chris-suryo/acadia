-- Round 17: paying someone back has to move the numbers.
--
-- The settle-up list could say who owed whom and then had no way to record that
-- anyone had paid, so the same debts sat there for the whole trip. A settlement
-- is money moving between two people without anything being bought, which is
-- exactly what the balance needs and nothing the expense ledger should show —
-- filing it as an expense would inflate what the group spent.

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  from_member uuid not null references members on delete restrict,
  to_member uuid not null references members on delete restrict,
  amount_cents int not null check (amount_cents > 0),
  /** Who recorded it — usually one of the two, but not enforced. */
  user_id uuid references profiles on delete set null,
  created_at timestamptz not null default now(),
  check (from_member <> to_member)
);

alter table settlements enable row level security;

-- Same posture as expenses: anyone can fix anyone's, because there's no
-- approval step and a wrong entry shouldn't outlive the person who made it.
drop policy if exists "settlements open" on settlements;
create policy "settlements open" on settlements
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table settlements;

-- Venmo is how this group actually moves money, so the handle belongs next to
-- the name. Optional: without it the button still opens Venmo with the amount
-- filled in, you just pick the person yourself.
alter table members add column if not exists venmo text not null default '';
