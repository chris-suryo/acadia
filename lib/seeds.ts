// Seed content ported from TripHubV4.jsx — single source for the mock data
// layer; supabase/migrations/0003_seed.sql mirrors these rows.

export const SEED_DAYS = [
  { id: "fri", day_label: "Friday", date_label: "Aug 14", subtitle: "Arrival", sort: 1 },
  { id: "sat", day_label: "Saturday", date_label: "Aug 15", subtitle: "Hike day", sort: 2 },
  { id: "sun", day_label: "Sunday", date_label: "Aug 16", subtitle: "Pack out", sort: 3 },
];

export const SEED_BLOCKS: {
  day_id: string;
  time_label: string;
  body: string;
  link_slug: string | null;
  sort: number;
}[] = [
  { day_id: "fri", time_label: "Morning", body: "Early crew checks in and claims both sites. Tents up first, while there's daylight and room to work.", link_slug: null, sort: 1 },
  { day_id: "fri", time_label: "Midday", body: "Firewood and ice run. Camp kitchen goes on one site; the other stays clear for tents.", link_slug: null, sort: 2 },
  { day_id: "fri", time_label: "Afternoon", body: "Open. Great Head or Ocean Path for anyone restless — both are short and close.", link_slug: "great-head", sort: 3 },
  { day_id: "fri", time_label: "Evening", body: "Late arrivals — text the group an hour out. Taco dinner, fire after.", link_slug: null, sort: 4 },
  { day_id: "fri", time_label: "Night", body: "Quiet hours. Food and anything scented sleeps in a car, not a tent.", link_slug: null, sort: 5 },
  { day_id: "sat", time_label: "Early", body: "Beehive crew out the door early — the Sand Beach lot fills by 8.", link_slug: "beehive", sort: 1 },
  { day_id: "sat", time_label: "Early", body: "Chris + Kona on the Great Head Loop across the cove. Dogs can't do the ladder trails.", link_slug: "great-head", sort: 2 },
  { day_id: "sat", time_label: "Midday", body: "Regroup at camp, or meet at Jordan Pond.", link_slug: "jordan-pond", sort: 3 },
  { day_id: "sat", time_label: "Afternoon", body: "Open. Bar Harbor, Thunder Hole, carriage roads — or nothing.", link_slug: "bar-harbor", sort: 4 },
  { day_id: "sat", time_label: "Evening", body: "The big cook. Everyone's here tonight.", link_slug: null, sort: 5 },
  { day_id: "sun", time_label: "Morning", body: "Breakfast, break camp, consolidate trash. Everything packs out.", link_slug: null, sort: 1 },
  { day_id: "sun", time_label: "Checkout", body: "Camping permit goes in the check-out box on the way out. Sweep both sites.", link_slug: null, sort: 2 },
  { day_id: "sun", time_label: "Drive", body: "Showers arrive late in the day — earlier departures get the dry drive.", link_slug: null, sort: 3 },
];

// Alana's two pre-claims ship as a label note; she re-claims once she opens
// the site (anonymous identities can't be seeded for her).
export const SEED_GEAR: { category: string; label: string; sort: number }[] = [
  { category: "Shelter", label: "Tents — spares for first-timers (Alana)", sort: 1 },
  { category: "Shelter", label: "Sleeping bags — spares (Alana)", sort: 2 },
  { category: "Shelter", label: "Tarp or canopy", sort: 3 },
  { category: "Camp Kitchen", label: "Camp stove + fuel", sort: 1 },
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
