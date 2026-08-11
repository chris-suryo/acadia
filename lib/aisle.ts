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

const RULES: [RegExp, Aisle][] = [
  [/\bice\b|frozen|popsicle/i, "Ice + Frozen"],
  [/foil|ziploc|zip.?lock|paper towel|napkin|trash|garbage|soap|sponge|plate|utensil|cutlery|cup(s)?\b|charcoal|propane|match|lighter|wipe|towel|bag(s)?\b|skewer/i, "Household"],
  [/beer|seltzer|cider|soda|cola|wine|juice|coffee|tea\b|water|lacroix|gatorade/i, "Drinks"],
  [/apple|orange|banana|berr|fruit|lettuce|tomato|onion|pepper|avocado|lime|lemon|potato|salad|veg|cilantro|garlic|corn\b|celery|carrot|cucumber|mushroom/i, "Produce"],
  [/bacon|sausage|burger|hot ?dog|\bdogs?\b|chicken|beef|steak|turkey|\bham\b|jerky|lobster|shrimp|fish|salmon|patt(y|ies)|deli|brat/i, "Meat + Deli"],
  [/egg|cheese|milk|butter|cream|yogurt|queso|sour cream/i, "Dairy + Eggs"],
  [/bread|bagel|\bbun|tortilla|roll(s)?\b|cornbread|muffin|croissant|pita/i, "Bakery"],
  [/chip|salsa|trail mix|\bbar(s)?\b|clif|marshmallow|chocolate|graham|cracker|cookie|nut(s)?\b|snack|cereal|oatmeal|granola|pasta|rice|bean|sauce|oil|salt|pepper|spice|sugar|flour|syrup|honey|peanut|jam|jelly|pancake mix/i, "Dry + Snacks"],
];

export function aisleOf(label: string): Aisle {
  for (const [re, aisle] of RULES) if (re.test(label)) return aisle;
  return "Other";
}
