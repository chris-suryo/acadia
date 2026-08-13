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
  /** Would you drive back to Ellsworth for it? */
  essential?: boolean;
}[] = [
  // One physical thing per row, flat — several people can claim the same row,
  // so a row has to BE one thing. You can own tongs and no spatula, and the
  // person with the spatula needs somewhere to say so. Mirrors migration 0035.
  { category: "Shelter", label: "Tents", sort: 1 },
  { category: "Shelter", label: "Spare sleeping bags", sort: 2 },
  { category: "Shelter", label: "Tarp or canopy", sort: 3, essential: true },
  { category: "Shelter", label: "Ground tarps", sort: 4 },
  { category: "Shelter", label: "Extra tent stakes", sort: 5 },
  { category: "Shelter", label: "Guylines", sort: 6 },
  { category: "Shelter", label: "Mallet", sort: 7 },
  { category: "Shelter", label: "Extra camp chairs", sort: 8 },

  { category: "Camp Kitchen", label: "Camp stove", sort: 1, essential: true },
  { category: "Camp Kitchen", label: "Propane", sort: 2, essential: true },
  { category: "Camp Kitchen", label: "Second stove", sort: 3, essential: true },
  { category: "Camp Kitchen", label: "Griddle for the fire", sort: 4, essential: true },
  { category: "Camp Kitchen", label: "Grill grate", sort: 5 },
  { category: "Camp Kitchen", label: "Pots + pans", sort: 6, essential: true },
  { category: "Camp Kitchen", label: "Cooking utensils", sort: 7, essential: true },
  { category: "Camp Kitchen", label: "Cutting board", sort: 8, essential: true },
  { category: "Camp Kitchen", label: "Sharp knife", sort: 9, essential: true },
  { category: "Camp Kitchen", label: "Tongs", sort: 10, essential: true },
  { category: "Camp Kitchen", label: "Spatula", sort: 11, essential: true },
  { category: "Camp Kitchen", label: "Can opener", sort: 12, essential: true },
  { category: "Camp Kitchen", label: "Bottle opener", sort: 13 },
  { category: "Camp Kitchen", label: "Big mixing bowl", sort: 14 },
  { category: "Camp Kitchen", label: "Spice kit", sort: 15 },
  { category: "Camp Kitchen", label: "Coffee maker — press or percolator", sort: 16, essential: true },
  { category: "Camp Kitchen", label: "Coffee filters", sort: 17 },
  { category: "Camp Kitchen", label: "Cups", sort: 18 },
  { category: "Camp Kitchen", label: "Camp table", sort: 19 },
  { category: "Camp Kitchen", label: "Tablecloth + clips", sort: 20 },
  { category: "Camp Kitchen", label: "Dish bin", sort: 21, essential: true },
  { category: "Camp Kitchen", label: "Dish soap + sponges", sort: 22 },
  { category: "Camp Kitchen", label: "Aluminum foil", sort: 23 },
  { category: "Camp Kitchen", label: "Ziplock bags", sort: 24 },
  { category: "Camp Kitchen", label: "Paper towels", sort: 25 },

  { category: "Coolers & Water", label: "Big cooler", sort: 1, essential: true },
  { category: "Coolers & Water", label: "Drinks cooler", sort: 2 },
  { category: "Coolers & Water", label: "Ice", sort: 3 },
  { category: "Coolers & Water", label: "Water jug", sort: 4, essential: true },

  { category: "Fire & Light", label: "Firewood — buy on the island", sort: 1, essential: true },
  { category: "Fire & Light", label: "Fire starters", sort: 2, essential: true },
  { category: "Fire & Light", label: "Lighters", sort: 3, essential: true },
  { category: "Fire & Light", label: "Hatchet", sort: 4 },
  { category: "Fire & Light", label: "Roasting sticks", sort: 5 },
  { category: "Fire & Light", label: "Water bucket for the fire", sort: 6, essential: true },
  { category: "Fire & Light", label: "Fire gloves", sort: 7 },
  { category: "Fire & Light", label: "Fire poker", sort: 8 },
  { category: "Fire & Light", label: "Lanterns", sort: 9, essential: true },
  { category: "Fire & Light", label: "Spare headlamp", sort: 10 },
  { category: "Fire & Light", label: "Spare batteries", sort: 11 },

  { category: "Site & Safety", label: "First-aid kit", sort: 1, essential: true },
  { category: "Site & Safety", label: "Tick remover", sort: 2 },
  { category: "Site & Safety", label: "Trash bags", sort: 3, essential: true },
  { category: "Site & Safety", label: "Multi-tool", sort: 4 },
  { category: "Site & Safety", label: "Duct tape", sort: 5 },
  { category: "Site & Safety", label: "Food bins for the cars", sort: 6 },
  { category: "Site & Safety", label: "Clothesline", sort: 7 },
  { category: "Site & Safety", label: "Camp broom", sort: 8 },
  { category: "Site & Safety", label: "Quarters for showers", sort: 9 },

  // Twelve people, two nights, one fire — somebody has to bring the cards.
  { category: "Games", label: "Deck of cards", sort: 1 },
  { category: "Games", label: "Uno", sort: 2 },
  { category: "Games", label: "Flip 7", sort: 3 },
  { category: "Games", label: "Monopoly Deal", sort: 4 },

  { category: "Dogs", label: "Leashes", sort: 1 },
  { category: "Dogs", label: "Tie-out line", sort: 2 },
  { category: "Dogs", label: "Water bowls", sort: 3 },
  { category: "Dogs", label: "Waste bags", sort: 4 },
  { category: "Dogs", label: "Dog beds", sort: 5 },
  { category: "Dogs", label: "Dog towels", sort: 6 },
];

export const GEAR_CATEGORIES = [
  "Shelter",
  "Camp Kitchen",
  "Coolers & Water",
  "Fire & Light",
  "Site & Safety",
  "Games",
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
  { category: "Clothing", label: "Hat", note: "", sort: 6 },
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
  { category: "Sleep", label: "Earplugs", note: "", sort: 5 },
  { category: "Sleep", label: "Extra blanket", note: "", sort: 6 },
  { category: "Sleep", label: "Eye mask", note: "", sort: 7 },
  { category: "Clothing", label: "Long pants", note: "", sort: 7 },
  { category: "Clothing", label: "Beanie", note: "", sort: 8 },
  { category: "Clothing", label: "Underwear", note: "", sort: 9 },
  { category: "Clothing", label: "Shirts + shorts for three days", note: "", sort: 10 },
  { category: "Clothing", label: "Sunglasses", note: "", sort: 11 },
  { category: "Mess Kit", label: "Mug for coffee", note: "", sort: 3 },
  { category: "Mess Kit", label: "Dish towel", note: "", sort: 4 },
  { category: "Essentials", label: "Daypack", note: "", sort: 6 },
  { category: "Essentials", label: "Cash + quarters", note: "the showers are coin-op", sort: 7 },
  // People bring the battery and forget the cable.
  { category: "Essentials", label: "Charging cable", note: "", sort: 8 },
  { category: "Toiletries", label: "Shower flip-flops", note: "", sort: 6 },
  { category: "Toiletries", label: "Lip balm", note: "", sort: 7 },
  // Fourth casualty of the label trim in 0026: "Wet wipes / hand sanitizer"
  // lost the half that matters with no showers and twelve people cooking.
  { category: "Toiletries", label: "Hand sanitizer", note: "no showers, and everyone handles the food", sort: 8, essential: true },
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
  // Two ballots. Every option is one pan or the fire, because the kit is one
  // portable burner and a grate — see migration 0028.
  { night: "Friday", meal: "Dinner", dish: "Taco bar", notes: "", sort: 1, veg: false, votable: true },
  { night: "Friday", meal: "Dinner", dish: "Fajitas", notes: "", sort: 2, veg: false, votable: true },
  { night: "Friday", meal: "Dinner", dish: "Burgers + dogs", notes: "", sort: 3, veg: false, votable: true },
  { night: "Friday", meal: "Dinner", dish: "Foil dinners", notes: "", sort: 4, veg: false, votable: true },
  { night: "Friday", meal: "Dinner", dish: "Campfire chili", notes: "", sort: 5, veg: false, votable: true },
  { night: "Saturday", meal: "Breakfast", dish: "Breakfast burritos", notes: "", sort: 1, veg: false, votable: true },
  { night: "Saturday", meal: "Breakfast", dish: "Oatmeal + fruit", notes: "", sort: 2, veg: false, votable: true },
  { night: "Saturday", meal: "Breakfast", dish: "Pancakes + bacon", notes: "", sort: 3, veg: false, votable: true },
  // Bought, not decided.
  { night: "Friday", meal: "Snacks", dish: "Chips + salsa", notes: "", sort: 5, veg: true, votable: false },
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

// What each dish needs, without how much of it. Mirrors migrations 0028–0029:
// the amounts were invented from a party size, and whoever shops works them out
// better standing in front of the shelf.
export const SEED_INGREDIENTS: [string, string][] = [
  // Beans are the base; the beef browns separately and goes in at the end.
  ["Taco bar", "Black beans"],
  ["Taco bar", "Ground beef"],
  ["Taco bar", "Taco seasoning"],
  ["Taco bar", "Tortillas"],
  ["Taco bar", "Shredded cheese"],
  ["Taco bar", "Lettuce"],
  ["Taco bar", "Tomatoes"],
  ["Taco bar", "Sour cream"],
  ["Taco bar", "Salsa"],
  ["Taco bar", "Limes"],
  ["Burgers + dogs", "Burger patties"],
  ["Burgers + dogs", "Veggie burgers"],
  ["Burgers + dogs", "Hot dogs"],
  ["Burgers + dogs", "Burger buns"],
  ["Burgers + dogs", "Hot dog buns"],
  ["Burgers + dogs", "Cheese slices"],
  ["Burgers + dogs", "Ketchup, mustard, relish"],
  ["Burgers + dogs", "Onion"],
  ["Burgers + dogs", "Lettuce"],
  ["Burgers + dogs", "Tomatoes"],
  // Fritos rather than cornbread — cornbread wanted an oven.
  ["Campfire chili", "Canned beans"],
  ["Campfire chili", "Crushed tomatoes"],
  ["Campfire chili", "Ground beef"],
  ["Campfire chili", "Onions"],
  ["Campfire chili", "Bell peppers"],
  ["Campfire chili", "Chili powder + cumin"],
  ["Campfire chili", "Shredded cheese"],
  ["Campfire chili", "Sour cream"],
  ["Campfire chili", "Fritos"],
  ["Fajitas", "Chicken thighs"],
  ["Fajitas", "Black beans"],
  ["Fajitas", "Bell peppers"],
  ["Fajitas", "Onions"],
  ["Fajitas", "Tortillas"],
  ["Fajitas", "Fajita seasoning"],
  ["Fajitas", "Shredded cheese"],
  ["Fajitas", "Sour cream"],
  ["Fajitas", "Limes"],
  // Everyone builds their own packet and it goes straight in the coals —
  // nothing to wash up, and skipping the kielbasa is the whole veg story.
  ["Foil dinners", "Kielbasa"],
  ["Foil dinners", "Potatoes"],
  ["Foil dinners", "Bell peppers"],
  ["Foil dinners", "Onions"],
  ["Foil dinners", "Carrots"],
  ["Foil dinners", "Butter"],
  ["Breakfast burritos", "Eggs"],
  ["Breakfast burritos", "Breakfast sausage"],
  ["Breakfast burritos", "Tortillas"],
  ["Breakfast burritos", "Shredded cheese"],
  ["Breakfast burritos", "Salsa"],
  ["Breakfast burritos", "Hot sauce"],
  ["Oatmeal + fruit", "Instant oatmeal"],
  ["Oatmeal + fruit", "Bananas"],
  ["Oatmeal + fruit", "Berries"],
  ["Oatmeal + fruit", "Brown sugar"],
  ["Pancakes + bacon", "Pancake mix"],
  ["Pancakes + bacon", "Maple syrup"],
  ["Pancakes + bacon", "Butter"],
  ["Pancakes + bacon", "Bacon"],
  // Hummus so the trail lunch works for everyone too.
  ["Sandwiches packed for the trail", "Deli turkey"],
  ["Sandwiches packed for the trail", "Deli ham"],
  ["Sandwiches packed for the trail", "Hummus"],
  ["Sandwiches packed for the trail", "Cheese slices"],
  ["Sandwiches packed for the trail", "Bread"],
  ["Sandwiches packed for the trail", "Mayo + mustard"],
  ["Sandwiches packed for the trail", "Lettuce"],
  ["Chips + salsa", "Tortilla chips"],
  ["Chips + salsa", "Salsa"],
  ["S'mores", "Graham crackers"],
  ["S'mores", "Marshmallows"],
  ["S'mores", "Chocolate bars"],
  ["Bagels + cream cheese", "Bagels"],
  ["Bagels + cream cheese", "Cream cheese"],
  ["Bagels + cream cheese", "Coffee"],
  ["Trail mix", "Trail mix"],
  ["Fruit — apples, oranges", "Apples"],
  ["Fruit — apples, oranges", "Oranges"],
  ["Beer + seltzer", "Beer"],
  ["Beer + seltzer", "Seltzer"],
];
