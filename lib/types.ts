export type Profile = {
  id: string;
  name: string;
  avatar_url: string;
  /** Which person on the roster this device belongs to. */
  member_id: string | null;
};

/**
 * Somebody on the trip.
 *
 * Separate from Profile because a profile is a *device* — it can't exist for
 * someone who hasn't opened the app, and one person with a phone and a laptop
 * has two. Splitting a bill needs people, so people get their own table.
 */
export type Member = {
  id: string;
  name: string;
  sort: number;
  /** Venmo handle, without the @. Empty when nobody's added one. */
  venmo: string;
};

/** Somebody paying somebody back. Not an expense — nothing was bought. */
export type Settlement = {
  id: string;
  from_member: string;
  to_member: string;
  amount_cents: number;
  user_id: string | null;
  created_at: string;
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
  /** Would you drive back to Ellsworth for it? Fourteen of thirty-nine. */
  essential: boolean;
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
  /** Not "important" — "you will regret this on Saturday morning". */
  essential: boolean;
};

export type MenuItem = {
  id: string;
  night: string; // Friday | Saturday | Sunday | Anytime
  meal: string; // Breakfast | Lunch | Dinner | Snacks | Drinks
  dish: string;
  notes: string;
  added_by: string | null;
  /** Vegetarian — drives the badge on the row. */
  veg: boolean;
  /** Put to a vote. False means it's simply being bought — the trail lunch,
   *  Sunday breakfast, snacks and drinks aren't questions. */
  votable: boolean;
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
  /** Who typed the row in — usually the payer, but not necessarily. */
  user_id: string;
  /** Who actually put money down. Null only if a member was removed. */
  payer_id: string | null;
  description: string;
  amount_cents: number;
  created_at: string;
};

/** One person this expense was split with. */
export type ExpenseShare = {
  expense_id: string;
  member_id: string;
};

/** A photo of what was actually bought. */
export type Receipt = {
  id: string;
  expense_id: string;
  url: string;
  sort: number;
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

/** One person's vote for a candidate dish. */
export type MenuVote = {
  menu_item_id: string;
  user_id: string;
};
