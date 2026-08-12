/**
 * The vibe check — options in plain language a first-timer can answer.
 *
 * These used to live in the intro, which is where they were first asked. The
 * intro now asks only who you are, and the questions live on the Ideas board
 * where they're acted on, so the constants moved somewhere neither component
 * owns.
 *
 * The survey columns predate this shape: `wants` = vibes joined, `hikes` = the
 * anything-else line, `bar_harbor` = camping experience.
 */
export const VIBE_CHIPS = [
  "A big hike",
  "Easy walks",
  "Swimming",
  "Views + sunsets",
  "Hanging at camp",
  "Town food + shops",
] as const;

export const PACE_CHIPS = [
  { value: "Up early, do it all", label: "Up early, do it all" },
  { value: "One good hike", label: "One good hike" },
  { value: "Wander, no plan", label: "Wander, no plan" },
];

export const EXPERIENCE_CHIPS = [
  { value: "First timer", label: "First timer" },
  { value: "Done it a bit", label: "Done it a bit" },
  { value: "Old hand", label: "Old hand" },
];

export const SURVEY_PLACEHOLDERS = {
  food: "s'mores night, a dish, allergies…",
  extra: "anything you're hoping to do or see…",
} as const;

// Answers picked under earlier label sets still live in the column; translate
// on read and drop repeats so a card never shows two vocabularies.
const VIBE_ALIASES: Record<string, string> = {
  "Big hikes": "A big hike",
  "Sunsets + views": "Views + sunsets",
  "Camp hangs": "Hanging at camp",
  "Bar Harbor": "Town food + shops",
};

export const splitVibes = (s: string): string[] => {
  const out: string[] = [];
  for (const raw of s.split(" · ")) {
    const v = raw.trim();
    if (!v) continue;
    const label = VIBE_ALIASES[v] ?? v;
    if (!out.includes(label)) out.push(label);
  }
  return out;
};
