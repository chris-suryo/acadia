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

type AnyRow = {
  user_id: string;
  activity: string;
  hikes: string;
  wants: string;
  bar_harbor: string;
  food: string;
  updated_at: string;
};

const FIELDS = ["activity", "hikes", "wants", "bar_harbor", "food"] as const;

/**
 * One person's answer, assembled from every device they've used.
 *
 * A survey row belongs to a device, and iOS mints a second one the moment
 * someone adds the app to their Home Screen. Taking the newest whole row
 * looked right until two devices held complementary halves: Alana picked her
 * pace on one and her vibes on the other, so newest-wins showed the pace and
 * silently dropped the vibes. Merge per field instead — newest non-empty
 * answer for each — and nothing anyone typed disappears because they switched
 * devices.
 *
 * `user_id` is the newest row's, so the card renders that device's avatar.
 */
export function mergeSurvey<T extends AnyRow>(rows: T[]): T | undefined {
  if (rows.length <= 1) return rows[0];
  const newestFirst = [...rows].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );
  const merged = { ...newestFirst[0] };
  for (const field of FIELDS)
    if (!merged[field])
      merged[field] = newestFirst.find((r) => r[field])?.[field] ?? "";
  return merged;
}

/** Everyone's answers, one merged row per person, keyed by `whose`. */
export function surveysByPerson<T extends AnyRow>(
  rows: T[],
  whose: (userId: string) => string,
): T[] {
  const byPerson = new Map<string, T[]>();
  for (const r of rows) {
    const who = whose(r.user_id) || r.user_id;
    byPerson.set(who, [...(byPerson.get(who) ?? []), r]);
  }
  return [...byPerson.values()].map((rs) => mergeSurvey(rs)!);
}
