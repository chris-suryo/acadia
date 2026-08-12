/**
 * Which part of the store a line belongs in.
 *
 * Guessed from the text rather than asked for: whoever types "clif bars" at a
 * traffic light shouldn't also have to pick an aisle, and a list sorted by
 * where things physically are is the difference between reading a list and
 * shopping one. Anything unrecognised falls to Other, which sorts last.
 */
export const AISLES = [
  "Produce",
  "Meat + Deli",
  "Dairy + Eggs",
  "Bakery",
  "Dry + Snacks",
  "Drinks",
  "Ice + Frozen",
  "Household",
  "Other",
] as const;

export type Aisle = (typeof AISLES)[number];

/**
 * Strip the quantity so it can't decide the aisle.
 *
 * "Marshmallows ×3 bags" was filing under Household because of the word "bags",
 * and "Beer ×3 cases" nearly did the same — the container a thing comes in says
 * nothing about where it sits in a shop.
 */
const withoutQuantity = (label: string) =>
  label
    .replace(/\s*[×x]\s*\d+[^,]*$/i, "")
    .replace(/\s+\d+(\.\d+)?\s*(lb|lbs|oz|qt|gal|kg|g)\b.*$/i, "")
    .trim() || label;

const RULES: [RegExp, Aisle][] = [
  [/\bice\b|frozen|popsicle/i, "Ice + Frozen"],
  [/foil|ziploc|zip.?lock|paper towel|napkin|trash|garbage|soap|sponge|plate|utensil|cutlery|cup(s)?\b|charcoal|propane|match|lighter|wipe|towel|bag(s)?\b|skewer/i, "Household"],
  // `cola` needs its boundaries or chocolate becomes a soft drink.
  [/beer|seltzer|cider|soda|\bcolas?\b|wine|juice|coffee|tea\b|water|lacroix|gatorade/i, "Drinks"],
  // Canned tomatoes are nowhere near the tomatoes. Checked before Produce so
  // the tin wins over the vegetable inside it.
  [/canned|crushed|\bcans?\b|\bjars?\b/i, "Dry + Snacks"],
  [/apple|orange|banana|berr|fruit|lettuce|tomato|onion|pepper|avocado|lime|lemon|potato|salad|veg|cilantro|garlic|corn\b|celery|carrot|cucumber|mushroom|spinach|kale|greens|broccoli|zucchini|cabbage|scallion|jalape/i, "Produce"],
  // Ahead of the meat counter on purpose: burger buns and hot dog buns are
  // bread. Tortillas are too — tortilla chips aren't, and neither is a mix.
  [/\bbread\b|bagel|\bbun|tortilla(?!\s*chip)|roll(s)?\b|cornbread(?!\s*mix)|muffin|croissant|pita/i, "Bakery"],
  // Jerky is shelf-stable and sits with the snacks, whatever it's made of.
  [/bacon|sausage|burger|hot ?dog|\bdogs?\b|chicken|beef(?!\s*jerky)|steak|turkey|\bham\b|lobster|shrimp|fish|salmon|patt(y|ies)|deli|brat/i, "Meat + Deli"],
  [/egg|cheese|milk|butter|cream|yogurt|queso|sour cream|hummus/i, "Dairy + Eggs"],
  [/chip|salsa|\bmix\b|\bbar(s)?\b|clif|jerky|marshmallow|chocolate|graham|cracker|cookie|nut(s)?\b|snack|cereal|oatmeal|granola|pasta|rice|bean|sauce|ketchup|mustard|mayo|relish|seasoning|powder|vinegar|oil|salt|pepper|spice|sugar|flour|syrup|honey|peanut|jam|jelly/i, "Dry + Snacks"],
];

export function aisleOf(label: string): Aisle {
  const what = withoutQuantity(label);
  for (const [re, aisle] of RULES) if (re.test(what)) return aisle;
  return "Other";
}
