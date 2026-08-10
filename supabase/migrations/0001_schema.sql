-- Acadia Base Camp — schema (BUILD_SPEC §5)

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  updated_at timestamptz default now()
);

create table itinerary_days (
  id text primary key,          -- 'fri' | 'sat' | 'sun'
  day_label text not null,      -- 'Friday'
  date_label text not null,     -- 'Aug 14'
  subtitle text not null,       -- 'Arrival'
  sort int not null
);

create table itinerary_blocks (
  id uuid primary key default gen_random_uuid(),
  day_id text references itinerary_days on delete cascade,
  time_label text not null default '',
  body text not null,
  link_slug text,               -- Explore entry id for "details ↗"
  sort int not null
);

create table gear_items (       -- group gear, shared
  id uuid primary key default gen_random_uuid(),
  category text not null,       -- Shelter | Camp Kitchen | Fire & Light | Site & Safety
  parent_id uuid references gear_items on delete cascade,
  label text not null,
  owner_id uuid references profiles,   -- null = unclaimed
  sort int not null default 0
);

create table personal_items (   -- private per-user packing list
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  category text not null,
  parent_id uuid references personal_items on delete cascade,
  label text not null,
  note text default '',
  checked boolean not null default false,
  sort int not null default 0
);

create table menu_items (       -- dishes, shared
  id uuid primary key default gen_random_uuid(),
  night text not null,          -- Friday | Saturday | Sunday | Anytime
  meal text not null,           -- Breakfast | Lunch | Dinner | Snacks | Drinks
  dish text not null,
  notes text default '',
  added_by uuid references profiles,
  sort int not null default 0
);

create table shopping_items (   -- store list, shared
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items on delete cascade,  -- null = standalone add
  label text not null,
  added_by uuid references profiles,
  checked boolean not null default false,
  checked_by uuid references profiles
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles,
  description text not null,
  amount_cents int not null check (amount_cents >= 0),
  created_at timestamptz default now()
);

create table forecast_cache (
  date_key date primary key,
  high int,
  low int,
  condition text,
  source text,                  -- 'nws' | 'open-meteo'
  fetched_at timestamptz default now()
);
