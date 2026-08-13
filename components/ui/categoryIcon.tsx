import {
  Backpack,
  Dices,
  Dog,
  Flame,
  type LucideIcon,
  Moon,
  Package,
  Shirt,
  ShowerHead,
  Snowflake,
  Sparkles,
  Tent,
  Utensils,
  UtensilsCrossed,
  BriefcaseMedical,
} from "lucide-react";

/**
 * A mark per packing section. Keyed loosely so a category someone types
 * themselves ("Dog stuff", "kitchen") still lands on something sensible, and
 * anything unrecognised falls back to a plain box rather than nothing —
 * a half-iconed list looks broken.
 */
const ICONS: [RegExp, LucideIcon][] = [
  [/shelter|tent|sleep/i, Tent],
  [/cooler|water|drink|ice/i, Snowflake],
  [/kitchen|cook|mess|food/i, UtensilsCrossed],
  [/fire|light/i, Flame],
  [/safety|first.?aid|site/i, BriefcaseMedical],
  [/game|dice|puzzle/i, Dices],
  [/dog|pet/i, Dog],
  [/cloth|wear/i, Shirt],
  [/essential|pack/i, Backpack],
  [/toiletr|wash|shower/i, ShowerHead],
  [/extra|fun/i, Sparkles],
];

export function categoryIcon(category: string): LucideIcon {
  for (const [re, icon] of ICONS) if (re.test(category)) return icon;
  return Package;
}

// Sleep and Mess Kit collide with the looser patterns above, so they're
// resolved by exact name first.
const EXACT: Record<string, LucideIcon> = {
  Sleep: Moon,
  "Mess Kit": Utensils,
  Shelter: Tent,
};

export function sectionIcon(category: string): LucideIcon {
  return EXACT[category] ?? categoryIcon(category);
}
