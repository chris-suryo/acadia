-- Round 12: the Food tab opened on four empty "Add" buttons, which asks a
-- first-timer to invent the menu. Seed real candidates and let people vote.

create table if not exists menu_votes (
  menu_item_id uuid not null references menu_items on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (menu_item_id, user_id)
);

alter table menu_votes enable row level security;

drop policy if exists "votes read" on menu_votes;
create policy "votes read" on menu_votes for select to authenticated using (true);
drop policy if exists "votes insert own" on menu_votes;
create policy "votes insert own" on menu_votes for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "votes delete own" on menu_votes;
create policy "votes delete own" on menu_votes for delete to authenticated
  using (user_id = auth.uid());

alter publication supabase_realtime add table menu_votes;

-- Candidates, not decisions: added_by stays null so they read as the app's
-- suggestions rather than someone's personal pick.
insert into menu_items (night, meal, dish, notes, sort)
select v.night, v.meal, v.dish, v.notes, v.sort
from (values
  ('Friday','Dinner','Chili + cornbread','one pot, feeds twelve, reheats Sunday',2),
  ('Friday','Dinner','Burgers + dogs','fastest after a 1 pm check-in',3),
  ('Friday','Dinner','Sausage + peppers','one pan, no sides needed',4),
  ('Friday','Snacks','Chips + salsa','something to open on arrival',5),
  ('Saturday','Breakfast','Eggs, bacon, toast','the classic, but twelve people is a lot of pan time',1),
  ('Saturday','Breakfast','Pancakes','needs the griddle',2),
  ('Saturday','Breakfast','Breakfast burritos','wrap them at home, warm them on the fire',3),
  ('Saturday','Breakfast','Oatmeal + fruit','fastest if we want an early trailhead',4),
  ('Saturday','Lunch','Sandwiches packed for the trail','no cooler on the mountain',5),
  ('Saturday','Lunch','Wraps + trail mix','lighter in a daypack',6),
  ('Saturday','Dinner','Out in Bar Harbor','the itinerary has ten places, call ahead for twelve',7),
  ('Saturday','Snacks','S''mores','Alana asked. Non-negotiable.',8),
  ('Sunday','Breakfast','Bagels + cream cheese','no cooking on pack-out day',1),
  ('Sunday','Breakfast','Leftovers scramble','clears the cooler before checkout',2),
  ('Sunday','Breakfast','Instant oatmeal + coffee','fastest, checkout is 11',3),
  ('Anytime','Snacks','Trail mix',' ',1),
  ('Anytime','Snacks','Clif bars or similar','one each per hiking day',2),
  ('Anytime','Snacks','Fruit — apples, oranges','survives a cooler-less car',3),
  ('Anytime','Snacks','Jerky',' ',4),
  ('Anytime','Drinks','Beer + seltzer','glass is a pain to pack out',5),
  ('Anytime','Drinks','Cider',' ',6)
) as v(night, meal, dish, notes, sort)
where not exists (
  select 1 from menu_items m where m.dish = v.dish and m.night = v.night
);
