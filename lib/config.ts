// Supabase anon key + URL are public by design (they ship to every browser);
// row security lives in RLS policies, not in key secrecy.
export const SUPABASE_URL = "https://jboghghdxgxgpccmqnlq.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_LHh0xpyJLnzqk3cCUdnIOA_Y9zOlG--";

export const DATA_MODE: "supabase" | "mock" =
  process.env.NEXT_PUBLIC_DATA_MODE === "mock" ? "mock" : "supabase";

export const PARTY_SIZE = 11;

// date_key (America/New_York) -> itinerary day id
export const TRIP_DATES: Record<string, string> = {
  "2026-08-14": "fri",
  "2026-08-15": "sat",
  "2026-08-16": "sun",
};

export const FORECAST_STALE_MS = 2 * 60 * 60 * 1000;
