export type Profile = {
  id: string;
  name: string;
  avatar_url: string;
};

export type ItineraryDay = {
  id: string; // 'fri' | 'sat' | 'sun'
  day_label: string;
  date_label: string;
  subtitle: string;
  sort: number;
};

export type DayPart = "morning" | "afternoon" | "evening";

export type ItineraryBlock = {
  id: string;
  day_id: string;
  title: string;
  detail: string;
  day_part: DayPart | null;
  link_slug: string | null;
  sort: number;
};

export type GearItem = {
  id: string;
  category: string;
  parent_id: string | null;
  label: string;
  owner_id: string | null;
  sort: number;
};

export type PersonalItem = {
  id: string;
  user_id: string;
  category: string;
  parent_id: string | null;
  label: string;
  note: string;
  checked: boolean;
  sort: number;
};

export type MenuItem = {
  id: string;
  night: string; // Friday | Saturday | Sunday | Anytime
  meal: string; // Breakfast | Lunch | Dinner | Snacks | Drinks
  dish: string;
  notes: string;
  added_by: string | null;
  sort: number;
};

export type ShoppingItem = {
  id: string;
  menu_item_id: string | null; // null = standalone add (snacks, ice)
  label: string;
  added_by: string | null;
  checked: boolean;
  checked_by: string | null;
};

export type Expense = {
  id: string;
  user_id: string;
  description: string;
  amount_cents: number;
  created_at: string;
};

export type SurveyRow = {
  user_id: string;
  activity: string; // Easy | A hike a day | Send it | ''
  hikes: string;
  wants: string;
  bar_harbor: string;
  food: string;
  updated_at: string;
};

export type ForecastRow = {
  date_key: string; // YYYY-MM-DD
  high: number | null;
  low: number | null;
  condition: string | null;
  source: string | null;
  fetched_at: string;
};
