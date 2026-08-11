// Seed content ported from TripHubV4.jsx — single source for the mock data
// layer; supabase/migrations/0003_seed.sql mirrors these rows.

export const SEED_DAYS = [
  { id: "fri", day_label: "Friday", date_label: "Aug 14", subtitle: "Arrival", sort: 1 },
  { id: "sat", day_label: "Saturday", date_label: "Aug 15", subtitle: "Park day", sort: 2 },
  { id: "sun", day_label: "Sunday", date_label: "Aug 16", subtitle: "Pack out", sort: 3 },
];

export const SEED_BLOCKS: {
  day_id: string;
  title: string;
  detail: string;
  day_part: "morning" | "afternoon" | "evening" | null;
  link_slug: string | null;
  sort: number;
}[] = [
  { day_id: "fri", title: "Rolling in all day", detail: "arrivals staggered — text the thread an hour out", day_part: null, link_slug: null, sort: 1 },
  { day_id: "fri", title: "Claim the sites, tents up", detail: "first crew sets the kitchen", day_part: "afternoon", link_slug: null, sort: 2 },
  { day_id: "fri", title: "Firewood + ice run", detail: "buy wood on the island — no out-of-state wood", day_part: "afternoon", link_slug: null, sort: 3 },
  { day_id: "fri", title: "Taco night at camp", detail: "we cook Friday", day_part: "evening", link_slug: null, sort: 4 },
  { day_id: "fri", title: "Campfire, stay in", detail: "food sleeps in cars · quiet hours at 10", day_part: "evening", link_slug: null, sort: 5 },
  { day_id: "sat", title: "Into the park", detail: "passes sorted at the gate", day_part: "morning", link_slug: null, sort: 1 },
  { day_id: "sat", title: "Shuttle or cars — call it at breakfast", detail: "Route 10 stops at the campground", day_part: "morning", link_slug: "shuttle", sort: 2 },
  { day_id: "sat", title: "Out in the park all day", detail: "Beehive · Ocean Path · Jordan Pond · Echo Lake", day_part: "afternoon", link_slug: "beehive", sort: 3 },
  { day_id: "sat", title: "Dinner in Bar Harbor", detail: "call ahead — nobody reserves for 12", day_part: "evening", link_slug: "bar-harbor", sort: 4 },
  { day_id: "sun", title: "Breakfast, break camp", detail: "trash packs out", day_part: "morning", link_slug: null, sort: 1 },
  { day_id: "sun", title: "Permit in the check-out box", detail: "sweep both sites", day_part: "morning", link_slug: null, sort: 2 },
  { day_id: "sun", title: "Roll out", detail: "checkout is 11 am", day_part: "morning", link_slug: null, sort: 3 },
];

// Alana's two pre-claims ship as a label note; she re-claims once she opens
// the site (anonymous identities can't be seeded for her). `parent` references
// another entry's label — claiming a parent claims the bundle.
export const SEED_GEAR: {
  category: string;
  label: string;
  sort: number;
  parent?: string;
}[] = [
  { category: "Shelter", label: "Tents — spares for first-timers (Alana)", sort: 1 },
  { category: "Shelter", label: "Sleeping bags — spares (Alana)", sort: 2 },
  { category: "Shelter", label: "Tarp or canopy", sort: 3 },
  { category: "Camp Kitchen", label: "Camp stove + fuel", sort: 1 },
  { category: "Camp Kitchen", label: "Propane canisters ×2", sort: 1, parent: "Camp stove + fuel" },
  { category: "Camp Kitchen", label: "Pots, pans, cooking utensils", sort: 2 },
  { category: "Camp Kitchen", label: "Cutting board + sharp knife", sort: 3 },
  { category: "Camp Kitchen", label: "Big cooler + ice", sort: 4 },
  { category: "Camp Kitchen", label: "Dish bin, soap, sponge, towel", sort: 5 },
  { category: "Camp Kitchen", label: "Folding camp table", sort: 6 },
  { category: "Camp Kitchen", label: "Water jug", sort: 7 },
  { category: "Camp Kitchen", label: "Foil, ziplocks, paper towels", sort: 8 },
  { category: "Fire & Light", label: "Firewood — buy local, don't transport", sort: 1 },
  { category: "Fire & Light", label: "Fire starter + lighter", sort: 2 },
  { category: "Fire & Light", label: "Lanterns / string lights", sort: 3 },
  { category: "Site & Safety", label: "Group first-aid kit", sort: 1 },
  { category: "Site & Safety", label: "Trash + recycling bags", sort: 2 },
  { category: "Site & Safety", label: "Multi-tool, duct tape, mallet", sort: 3 },
];

export const GEAR_CATEGORIES = ["Shelter", "Camp Kitchen", "Fire & Light", "Site & Safety"];

// Copied into personal_items per profile on first sign-in (seed_personal_items RPC).
export const SEED_PERSONAL: { category: string; label: string; note: string; sort: number }[] = [
  { category: "Sleep", label: "Sleeping pad or air mattress", note: "insulation from the ground, not just cushion", sort: 1 },
  { category: "Sleep", label: "Sleeping bag", note: "nights around 55°F — ask Alana if you don't own one", sort: 2 },
  { category: "Sleep", label: "Pillow", note: "", sort: 3 },
  { category: "Sleep", label: "Tent, if you have your own", note: "", sort: 4 },
  { category: "Clothing", label: "Warm layer — fleece or puffy", note: "the thing first-timers forget", sort: 1 },
  { category: "Clothing", label: "Rain jacket", note: "shower expected Friday morning", sort: 2 },
  { category: "Clothing", label: "Hiking shoes with tread", note: "the trails here are granite", sort: 3 },
  { category: "Clothing", label: "Camp shoes or sandals", note: "", sort: 4 },
  { category: "Clothing", label: "Socks — days plus one", note: "", sort: 5 },
  { category: "Clothing", label: "Hat + sunglasses", note: "", sort: 6 },
  { category: "Mess Kit", label: "Plate, bowl, cup, utensils", note: "reusable — trash packs out", sort: 1 },
  { category: "Mess Kit", label: "Water bottle", note: "spigots at camp, no filter needed", sort: 2 },
  { category: "Essentials", label: "Headlamp or flashlight", note: "", sort: 1 },
  { category: "Essentials", label: "Portable charger", note: "no outlets at the sites", sort: 2 },
  { category: "Essentials", label: "Personal meds", note: "", sort: 3 },
  { category: "Essentials", label: "Park pass, or card for the gate", note: "", sort: 4 },
  { category: "Essentials", label: "Offline maps downloaded", note: "cell service drops inside the park", sort: 5 },
  { category: "Toiletries", label: "Toothbrush + toothpaste", note: "", sort: 1 },
  { category: "Toiletries", label: "Sunscreen", note: "", sort: 2 },
  { category: "Toiletries", label: "Bug spray", note: "", sort: 3 },
  { category: "Toiletries", label: "Wet wipes / hand sanitizer", note: "no showers at Blackwoods", sort: 4 },
  { category: "Toiletries", label: "Quick-dry towel", note: "", sort: 5 },
  { category: "Extras", label: "Camp chair", note: "", sort: 1 },
  { category: "Extras", label: "Swimsuit", note: "", sort: 2 },
  { category: "Extras", label: "Cards, book, speaker", note: "", sort: 3 },
];

export const PERSONAL_CATEGORIES = ["Sleep", "Clothing", "Mess Kit", "Essentials", "Toiletries", "Extras"];

export const SEED_MENU = [
  { night: "Friday", meal: "Dinner", dish: "Tacos", notes: "", sort: 1 },
];

export const NIGHTS = ["Friday", "Saturday", "Sunday", "Anytime"];
export const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks", "Drinks"];
