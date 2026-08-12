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
  { day_id: "fri", title: "Check in", detail: "from 1 pm", day_part: "afternoon", link_slug: null, sort: 2 },
  { day_id: "fri", title: "Camp setup", detail: "tents, kitchen, tarp", day_part: "afternoon", link_slug: null, sort: 3 },
  { day_id: "fri", title: "Firewood, ice, water", detail: "buy wood on the island", day_part: "afternoon", link_slug: null, sort: 4 },
  { day_id: "fri", title: "Cook dinner at camp", detail: "", day_part: "evening", link_slug: null, sort: 5 },
  { day_id: "fri", title: "Campfire, plan Saturday", detail: "food in the cars overnight", day_part: "evening", link_slug: null, sort: 6 },
  { day_id: "sat", title: "Cook breakfast", detail: "", day_part: "morning", link_slug: null, sort: 1 },
  { day_id: "sat", title: "Pick the hikes", detail: "who's going where", day_part: "morning", link_slug: null, sort: 2 },
  { day_id: "sat", title: "Shuttle or cars", detail: "", day_part: "morning", link_slug: "shuttle", sort: 3 },
  { day_id: "sat", title: "Out in the park", detail: "", day_part: "afternoon", link_slug: "beehive", sort: 4 },
  { day_id: "sat", title: "Dinner in Bar Harbor", detail: "call ahead for 11", day_part: "evening", link_slug: "bar-harbor", sort: 5 },
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
  /** Mirrors migration 0024 — the fourteen you'd drive back for. */
  essential?: boolean;
}[] = [
  { category: "Shelter", label: "Tents — spares", sort: 1 },
  { category: "Shelter", label: "Sleeping bags — spares", sort: 2 },
  { category: "Shelter", label: "Tarp or canopy", sort: 3 , essential: true },
  { category: "Camp Kitchen", label: "Camp stove + fuel", sort: 1 , essential: true },
  { category: "Camp Kitchen", label: "Propane ×2", sort: 1, parent: "Camp stove + fuel" , essential: true },
  { category: "Camp Kitchen", label: "Pots, pans, utensils", sort: 2 , essential: true },
  { category: "Camp Kitchen", label: "Cutting board + knife", sort: 3 , essential: true },
  { category: "Camp Kitchen", label: "Big cooler + ice", sort: 4 , essential: true },
  { category: "Camp Kitchen", label: "Dish bin + soap", sort: 5 , essential: true },
  { category: "Camp Kitchen", label: "Camp table", sort: 6 },
  { category: "Camp Kitchen", label: "Water jug", sort: 7 , essential: true },
  { category: "Camp Kitchen", label: "Foil + ziplocks", sort: 8 },
  { category: "Fire & Light", label: "Firewood — buy on the island", sort: 1 , essential: true },
  { category: "Fire & Light", label: "Fire starter + lighter", sort: 2 , essential: true },
  { category: "Fire & Light", label: "Lanterns", sort: 3 , essential: true },
  { category: "Site & Safety", label: "First-aid kit", sort: 1 , essential: true },
  { category: "Site & Safety", label: "Trash + recycling bags", sort: 2 , essential: true },
  { category: "Site & Safety", label: "Multi-tool + duct tape", sort: 3 },
  // Round 11: the gaps a twelve-person, two-night camp actually hits.
  { category: "Shelter", label: "Ground tarps", sort: 4 },
  { category: "Shelter", label: "Stakes + guylines", sort: 5 },
  { category: "Camp Kitchen", label: "Coffee + filters", sort: 9 , essential: true },
  { category: "Camp Kitchen", label: "Second cooler — drinks", sort: 10 },
  { category: "Camp Kitchen", label: "Ice", sort: 11 },
  { category: "Camp Kitchen", label: "Grill grate", sort: 12 },
  { category: "Camp Kitchen", label: "Mugs + cups", sort: 13 },
  { category: "Camp Kitchen", label: "Spice kit", sort: 14 },
  { category: "Camp Kitchen", label: "Bottle opener", sort: 15 },
  { category: "Fire & Light", label: "Spare batteries", sort: 4 },
  { category: "Fire & Light", label: "Fire gloves + poker", sort: 5 },
  { category: "Site & Safety", label: "Tick remover", sort: 4 },
  { category: "Site & Safety", label: "Food bins for the cars", sort: 5 },
  { category: "Site & Safety", label: "Clothesline", sort: 6 },
  { category: "Site & Safety", label: "Camp broom", sort: 7 },
  { category: "Site & Safety", label: "Quarters for showers", sort: 8 },
  { category: "Dogs", label: "Leashes", sort: 1 },
  { category: "Dogs", label: "Tie-out line", sort: 2 },
  { category: "Dogs", label: "Water bowls", sort: 3 },
  { category: "Dogs", label: "Waste bags", sort: 4 },
  { category: "Dogs", label: "Dog bed + towel", sort: 5 },
];

export const GEAR_CATEGORIES = [
  "Shelter",
  "Camp Kitchen",
  "Fire & Light",
  "Site & Safety",
  "Dogs",
];

// Copied into personal_items per profile on first sign-in (seed_personal_items RPC).
export const SEED_PERSONAL: {
  category: string;
  label: string;
  note: string;
  sort: number;
  essential?: boolean;
}[] = [
  { category: "Sleep", label: "Sleeping pad", note: "", sort: 1 , essential: true },
  { category: "Sleep", label: "Sleeping bag", note: "around 55°F at night — ask Alana for a spare", sort: 2 , essential: true },
  { category: "Sleep", label: "Pillow", note: "", sort: 3 },
  { category: "Sleep", label: "Tent, if you have one", note: "", sort: 4 },
  { category: "Clothing", label: "Warm layer", note: "", sort: 1 , essential: true },
  { category: "Clothing", label: "Rain jacket", note: "rain Friday morning", sort: 2 , essential: true },
  { category: "Clothing", label: "Hiking shoes", note: "", sort: 3 , essential: true },
  { category: "Clothing", label: "Camp shoes", note: "", sort: 4 },
  { category: "Clothing", label: "Socks", note: "", sort: 5 },
  { category: "Clothing", label: "Hat + sunglasses", note: "", sort: 6 },
  { category: "Mess Kit", label: "Plate, bowl, utensils", note: "", sort: 1 },
  { category: "Mess Kit", label: "Water bottle", note: "", sort: 2 , essential: true },
  { category: "Essentials", label: "Headlamp", note: "", sort: 1 , essential: true },
  { category: "Essentials", label: "Portable charger", note: "no outlets at camp", sort: 2 },
  { category: "Essentials", label: "Personal meds", note: "", sort: 3 , essential: true },
  { category: "Essentials", label: "Park pass or card", note: "", sort: 4 },
  { category: "Essentials", label: "Offline maps", note: "", sort: 5 },
  { category: "Toiletries", label: "Toothbrush + toothpaste", note: "", sort: 1 },
  { category: "Toiletries", label: "Sunscreen", note: "", sort: 2 },
  { category: "Toiletries", label: "Bug spray", note: "", sort: 3 , essential: true },
  { category: "Toiletries", label: "Wet wipes", note: "no showers at Blackwoods", sort: 4 },
  { category: "Toiletries", label: "Towel", note: "", sort: 5 },
  { category: "Extras", label: "Camp chair", note: "", sort: 1 },
  { category: "Extras", label: "Swimsuit", note: "", sort: 2 },
  { category: "Extras", label: "Cards, book, speaker", note: "", sort: 3 },
  // Round 11 additions.
  { category: "Sleep", label: "Earplugs + eye mask", note: "", sort: 5 },
  { category: "Clothing", label: "Long pants", note: "", sort: 7 },
  { category: "Clothing", label: "Beanie", note: "", sort: 8 },
  { category: "Mess Kit", label: "Mug for coffee", note: "", sort: 3 },
  { category: "Mess Kit", label: "Dish towel", note: "", sort: 4 },
  { category: "Essentials", label: "Daypack", note: "", sort: 6 },
  { category: "Essentials", label: "Cash + quarters", note: "the showers are coin-op", sort: 7 },
  { category: "Toiletries", label: "Shower flip-flops", note: "", sort: 6 },
  { category: "Toiletries", label: "Lip balm", note: "", sort: 7 },
  { category: "Extras", label: "Dry bag for your phone", note: "", sort: 4 },
  { category: "Extras", label: "Trekking poles", note: "", sort: 5 },
];

export const PERSONAL_CATEGORIES = ["Sleep", "Clothing", "Mess Kit", "Essentials", "Toiletries", "Extras"];

// The party, alphabetical — a picker is scanned, not read. Mirrors migration
// 0019; the live roster keeps whatever display name each person set for
// themselves, so Erin is "Erin 🍀" there.
export const SEED_MEMBERS = [
  "Alana",
  "Alexis",
  "Ariana",
  "Ashley",
  "Chris",
  "Erin",
  "Irene",
  "Mayank",
  "Molida",
  "Patrick",
  "Sng",
];

// Candidates for the group to vote on, not decisions. Every cooked meal has a
// vegetarian option; `veg` drives the badge on the row. Mirrors
// supabase/migrations/0014 and 0016.
export const SEED_MENU: {
  night: string;
  meal: string;
  dish: string;
  notes: string;
  sort: number;
  veg: boolean;
  votable: boolean;
}[] = [
  { night: "Friday", meal: "Dinner", dish: "Tacos", notes: "", sort: 1, veg: false, votable: true },
  { night: "Friday", meal: "Dinner", dish: "Burgers + dogs", notes: "", sort: 3, veg: false, votable: true },
  { night: "Friday", meal: "Dinner", dish: "Veggie chili + cornbread", notes: "", sort: 7, veg: true, votable: true },
  { night: "Friday", meal: "Snacks", dish: "Chips + salsa", notes: "", sort: 5, veg: true, votable: false },
  { night: "Saturday", meal: "Breakfast", dish: "Eggs, bacon, toast", notes: "", sort: 1, veg: false, votable: true },
  { night: "Saturday", meal: "Breakfast", dish: "Pancakes", notes: "", sort: 2, veg: true, votable: true },
  { night: "Saturday", meal: "Breakfast", dish: "Breakfast burritos", notes: "", sort: 3, veg: false, votable: true },
  { night: "Saturday", meal: "Lunch", dish: "Sandwiches packed for the trail", notes: "", sort: 5, veg: false, votable: false },
  { night: "Saturday", meal: "Snacks", dish: "S'mores", notes: "", sort: 8, veg: true, votable: false },
  { night: "Sunday", meal: "Breakfast", dish: "Bagels + cream cheese", notes: "", sort: 1, veg: true, votable: false },
  { night: "Anytime", meal: "Snacks", dish: "Trail mix", notes: "", sort: 1, veg: true, votable: false },
  { night: "Anytime", meal: "Snacks", dish: "Fruit — apples, oranges", notes: "", sort: 3, veg: true, votable: false },
  { night: "Anytime", meal: "Drinks", dish: "Beer + seltzer", notes: "", sort: 5, veg: true, votable: false },
];

/**
 * The two meals that get voted on.
 *
 * Everything else on the menu is bought rather than decided: the trail lunch,
 * Sunday breakfast, snacks and drinks. A dish added by hand into one of these
 * slots joins the ballot; added anywhere else it just gets bought.
 */
export const VOTED_SLOTS: [string, string][] = [
  ["Friday", "Dinner"],
  ["Saturday", "Breakfast"],
];

export const votableSlot = (night: string, meal: string) =>
  VOTED_SLOTS.some(([n, m]) => n === night && m === meal);

export const NIGHTS = ["Friday", "Saturday", "Sunday", "Anytime"];
export const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks", "Drinks"];

// Ingredients for the candidate dishes, quantities for eleven over three days.
// Mirrors migration 0023 — the Store list is only useful if the menu feeds it.
export const SEED_INGREDIENTS: [string, string][] = [
  ["Tacos", "Ground beef 4 lb"],
  ["Tacos", "Taco seasoning ×3"],
  ["Tacos", "Tortillas ×24"],
  ["Tacos", "Shredded cheese 2 lb"],
  ["Tacos", "Lettuce ×2 heads"],
  ["Tacos", "Tomatoes ×6"],
  ["Tacos", "Sour cream 24 oz"],
  ["Tacos", "Salsa ×2 jars"],
  ["Tacos", "Limes ×6"],
  ["Burgers + dogs", "Burger patties ×16"],
  ["Burgers + dogs", "Hot dogs ×24"],
  ["Burgers + dogs", "Burger buns ×16"],
  ["Burgers + dogs", "Hot dog buns ×24"],
  ["Burgers + dogs", "Cheese slices ×16"],
  ["Burgers + dogs", "Ketchup, mustard, relish"],
  ["Burgers + dogs", "Onion ×2"],
  ["Veggie chili + cornbread", "Mixed beans ×6 cans"],
  ["Veggie chili + cornbread", "Crushed tomatoes ×4"],
  ["Veggie chili + cornbread", "Onions ×3"],
  ["Veggie chili + cornbread", "Bell peppers ×3"],
  ["Veggie chili + cornbread", "Chili powder + cumin"],
  ["Veggie chili + cornbread", "Cornbread mix ×3"],
  ["Chips + salsa", "Tortilla chips ×4 bags"],
  ["Chips + salsa", "Salsa ×3 jars"],
  ["Eggs, bacon, toast", "Eggs ×36"],
  ["Eggs, bacon, toast", "Bacon 3 lb"],
  ["Eggs, bacon, toast", "Bread ×3 loaves"],
  ["Eggs, bacon, toast", "Butter 1 lb"],
  ["Pancakes", "Pancake mix ×2 boxes"],
  ["Pancakes", "Maple syrup"],
  ["Pancakes", "Butter 1 lb"],
  ["Breakfast burritos", "Eggs ×24"],
  ["Breakfast burritos", "Breakfast sausage 2 lb"],
  ["Breakfast burritos", "Tortillas ×24"],
  ["Breakfast burritos", "Shredded cheese 1 lb"],
  ["Breakfast burritos", "Hot sauce"],
  ["Sandwiches packed for the trail", "Deli turkey 2 lb"],
  ["Sandwiches packed for the trail", "Deli ham 2 lb"],
  ["Sandwiches packed for the trail", "Cheese slices 1 lb"],
  ["Sandwiches packed for the trail", "Bread ×3 loaves"],
  ["Sandwiches packed for the trail", "Mayo + mustard"],
  ["Sandwiches packed for the trail", "Lettuce ×1 head"],
  ["S'mores", "Graham crackers ×3 boxes"],
  ["S'mores", "Marshmallows ×3 bags"],
  ["S'mores", "Chocolate bars ×12"],
  ["Bagels + cream cheese", "Bagels ×24"],
  ["Bagels + cream cheese", "Cream cheese ×3 tubs"],
  ["Bagels + cream cheese", "Coffee 2 lb"],
  ["Trail mix", "Trail mix ×4 bags"],
  ["Fruit — apples, oranges", "Apples ×12"],
  ["Fruit — apples, oranges", "Oranges ×12"],
  ["Beer + seltzer", "Beer ×3 cases"],
  ["Beer + seltzer", "Seltzer ×3 cases"],
];
