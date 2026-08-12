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
  { day_id: "sat", title: "Dinner in Bar Harbor", detail: "call ahead for 12", day_part: "evening", link_slug: "bar-harbor", sort: 5 },
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
  // Round 11: the gaps a twelve-person, two-night camp actually hits.
  { category: "Shelter", label: "Ground tarps or footprints", sort: 4 },
  { category: "Shelter", label: "Extra stakes + guylines", sort: 5 },
  { category: "Camp Kitchen", label: "Coffee — percolator or press, and filters", sort: 9 },
  { category: "Camp Kitchen", label: "Second cooler — drinks only", sort: 10 },
  { category: "Camp Kitchen", label: "Ice — restock Saturday", sort: 11 },
  { category: "Camp Kitchen", label: "Griddle or grill grate", sort: 12 },
  { category: "Camp Kitchen", label: "Mugs + cups for twelve", sort: 13 },
  { category: "Camp Kitchen", label: "Oil, salt, pepper, spice kit", sort: 14 },
  { category: "Camp Kitchen", label: "Bottle opener + corkscrew", sort: 15 },
  { category: "Fire & Light", label: "Spare batteries + a backup headlamp", sort: 4 },
  { category: "Fire & Light", label: "Fire gloves + poker", sort: 5 },
  { category: "Site & Safety", label: "Tick remover + tweezers", sort: 4 },
  { category: "Site & Safety", label: "Bins for the food — it all goes in the cars overnight", sort: 5 },
  { category: "Site & Safety", label: "Paracord clothesline + clips", sort: 6 },
  { category: "Site & Safety", label: "Camp broom + dustpan", sort: 7 },
  { category: "Site & Safety", label: "Quarters for the Otter Creek showers", sort: 8 },
  { category: "Dogs", label: "Leashes — six feet max in the park", sort: 1 },
  { category: "Dogs", label: "Tie-out line for the site", sort: 2 },
  { category: "Dogs", label: "Water bowls", sort: 3 },
  { category: "Dogs", label: "Waste bags", sort: 4 },
  { category: "Dogs", label: "Bed or blanket, and a towel for wet dogs", sort: 5 },
];

export const GEAR_CATEGORIES = [
  "Shelter",
  "Camp Kitchen",
  "Fire & Light",
  "Site & Safety",
  "Dogs",
];

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
  // Round 11 additions.
  { category: "Sleep", label: "Earplugs + eye mask", note: "twelve people, one campfire, thin nylon walls", sort: 5 },
  { category: "Clothing", label: "Long pants for the evening", note: "ticks in the grass, mosquitoes after dark", sort: 7 },
  { category: "Clothing", label: "Beanie", note: "it drops to the mid-50s overnight", sort: 8 },
  { category: "Mess Kit", label: "Mug for coffee", note: "", sort: 3 },
  { category: "Mess Kit", label: "Dish towel", note: "", sort: 4 },
  { category: "Essentials", label: "Daypack for the hikes", note: "water, layer, snacks", sort: 6 },
  { category: "Essentials", label: "Cash + quarters", note: "the Otter Creek showers are coin-op", sort: 7 },
  { category: "Toiletries", label: "Flip-flops for the showers", note: "", sort: 6 },
  { category: "Toiletries", label: "Lip balm with SPF", note: "", sort: 7 },
  { category: "Extras", label: "Dry bag or a ziplock for your phone", note: "", sort: 4 },
  { category: "Extras", label: "Trekking poles, if you use them", note: "", sort: 5 },
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
}[] = [
  { night: "Friday", meal: "Dinner", dish: "Tacos", notes: "", sort: 1, veg: false },
  { night: "Friday", meal: "Dinner", dish: "Chili + cornbread", notes: "", sort: 2, veg: false },
  { night: "Friday", meal: "Dinner", dish: "Burgers + dogs", notes: "", sort: 3, veg: false },
  { night: "Friday", meal: "Dinner", dish: "Sausage + peppers", notes: "", sort: 4, veg: false },
  { night: "Friday", meal: "Dinner", dish: "Black bean tacos", notes: "", sort: 6, veg: true },
  { night: "Friday", meal: "Dinner", dish: "Veggie chili + cornbread", notes: "", sort: 7, veg: true },
  { night: "Friday", meal: "Snacks", dish: "Chips + salsa", notes: "", sort: 5, veg: true },
  { night: "Saturday", meal: "Breakfast", dish: "Eggs, bacon, toast", notes: "", sort: 1, veg: false },
  { night: "Saturday", meal: "Breakfast", dish: "Pancakes", notes: "", sort: 2, veg: true },
  { night: "Saturday", meal: "Breakfast", dish: "Breakfast burritos", notes: "", sort: 3, veg: false },
  { night: "Saturday", meal: "Breakfast", dish: "Oatmeal + fruit", notes: "", sort: 4, veg: true },
  { night: "Saturday", meal: "Breakfast", dish: "Veggie scramble", notes: "", sort: 9, veg: true },
  { night: "Saturday", meal: "Lunch", dish: "Sandwiches packed for the trail", notes: "", sort: 5, veg: false },
  { night: "Saturday", meal: "Lunch", dish: "Wraps + trail mix", notes: "", sort: 6, veg: false },
  { night: "Saturday", meal: "Lunch", dish: "Hummus + veg wraps", notes: "", sort: 10, veg: true },
  { night: "Saturday", meal: "Dinner", dish: "Out in Bar Harbor", notes: "", sort: 7, veg: false },
  { night: "Saturday", meal: "Snacks", dish: "S'mores", notes: "", sort: 8, veg: true },
  { night: "Sunday", meal: "Breakfast", dish: "Bagels + cream cheese", notes: "", sort: 1, veg: true },
  { night: "Sunday", meal: "Breakfast", dish: "Leftovers scramble", notes: "", sort: 2, veg: false },
  { night: "Sunday", meal: "Breakfast", dish: "Instant oatmeal + coffee", notes: "", sort: 3, veg: true },
  { night: "Anytime", meal: "Snacks", dish: "Trail mix", notes: "", sort: 1, veg: true },
  { night: "Anytime", meal: "Snacks", dish: "Clif bars or similar", notes: "", sort: 2, veg: true },
  { night: "Anytime", meal: "Snacks", dish: "Fruit — apples, oranges", notes: "", sort: 3, veg: true },
  { night: "Anytime", meal: "Snacks", dish: "Jerky", notes: "", sort: 4, veg: false },
  { night: "Anytime", meal: "Drinks", dish: "Beer + seltzer", notes: "", sort: 5, veg: true },
  { night: "Anytime", meal: "Drinks", dish: "Cider", notes: "", sort: 6, veg: true },
];

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
  ["Chili + cornbread", "Ground beef 3 lb"],
  ["Chili + cornbread", "Canned beans ×6"],
  ["Chili + cornbread", "Crushed tomatoes ×4"],
  ["Chili + cornbread", "Onions ×3"],
  ["Chili + cornbread", "Chili powder + cumin"],
  ["Chili + cornbread", "Cornbread mix ×3"],
  ["Chili + cornbread", "Shredded cheese 1 lb"],
  ["Burgers + dogs", "Burger patties ×16"],
  ["Burgers + dogs", "Hot dogs ×24"],
  ["Burgers + dogs", "Burger buns ×16"],
  ["Burgers + dogs", "Hot dog buns ×24"],
  ["Burgers + dogs", "Cheese slices ×16"],
  ["Burgers + dogs", "Ketchup, mustard, relish"],
  ["Burgers + dogs", "Onion ×2"],
  ["Sausage + peppers", "Italian sausage 4 lb"],
  ["Sausage + peppers", "Bell peppers ×8"],
  ["Sausage + peppers", "Onions ×4"],
  ["Sausage + peppers", "Hoagie rolls ×12"],
  ["Sausage + peppers", "Olive oil"],
  ["Black bean tacos", "Black beans ×6 cans"],
  ["Black bean tacos", "Tortillas ×24"],
  ["Black bean tacos", "Shredded cheese 1 lb"],
  ["Black bean tacos", "Avocados ×6"],
  ["Black bean tacos", "Limes ×6"],
  ["Black bean tacos", "Salsa ×2 jars"],
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
  ["Oatmeal + fruit", "Oatmeal ×2 canisters"],
  ["Oatmeal + fruit", "Bananas ×12"],
  ["Oatmeal + fruit", "Berries ×2 pints"],
  ["Oatmeal + fruit", "Brown sugar"],
  ["Veggie scramble", "Eggs ×36"],
  ["Veggie scramble", "Bell peppers ×3"],
  ["Veggie scramble", "Onion ×2"],
  ["Veggie scramble", "Mushrooms 1 lb"],
  ["Veggie scramble", "Shredded cheese 1 lb"],
  ["Sandwiches packed for the trail", "Deli turkey 2 lb"],
  ["Sandwiches packed for the trail", "Deli ham 2 lb"],
  ["Sandwiches packed for the trail", "Cheese slices 1 lb"],
  ["Sandwiches packed for the trail", "Bread ×3 loaves"],
  ["Sandwiches packed for the trail", "Mayo + mustard"],
  ["Sandwiches packed for the trail", "Lettuce ×1 head"],
  ["Wraps + trail mix", "Tortillas ×24"],
  ["Wraps + trail mix", "Deli turkey 2 lb"],
  ["Wraps + trail mix", "Hummus ×2 tubs"],
  ["Wraps + trail mix", "Trail mix ×3 bags"],
  ["Hummus + veg wraps", "Hummus ×3 tubs"],
  ["Hummus + veg wraps", "Tortillas ×24"],
  ["Hummus + veg wraps", "Cucumbers ×3"],
  ["Hummus + veg wraps", "Bell peppers ×3"],
  ["Hummus + veg wraps", "Spinach ×1 bag"],
  ["S'mores", "Graham crackers ×3 boxes"],
  ["S'mores", "Marshmallows ×3 bags"],
  ["S'mores", "Chocolate bars ×12"],
  ["Bagels + cream cheese", "Bagels ×24"],
  ["Bagels + cream cheese", "Cream cheese ×3 tubs"],
  ["Leftovers scramble", "Eggs ×24"],
  ["Instant oatmeal + coffee", "Instant oatmeal ×2 boxes"],
  ["Instant oatmeal + coffee", "Coffee 2 lb"],
  ["Trail mix", "Trail mix ×4 bags"],
  ["Clif bars or similar", "Clif bars ×24"],
  ["Fruit — apples, oranges", "Apples ×12"],
  ["Fruit — apples, oranges", "Oranges ×12"],
  ["Jerky", "Beef jerky ×4 bags"],
  ["Beer + seltzer", "Beer ×3 cases"],
  ["Beer + seltzer", "Seltzer ×3 cases"],
  ["Cider", "Cider ×2 six-packs"],
];
