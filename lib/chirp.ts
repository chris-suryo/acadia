/**
 * Chirp's clock and linkifier — pure functions, tested in test/chirp.test.mjs.
 */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Twitter's relative clock: "now" → "4m" → "2h" → "Fri" → "Aug 3".
 *
 * Clocks on twelve phones disagree; a post from three seconds in the future
 * is a skewed clock, not time travel, so anything not clearly old is "now".
 */
export function chirpTime(iso: string, now: Date): string {
  const then = new Date(iso);
  const ms = now.getTime() - then.getTime();
  if (ms < 60_000) return "now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  if (ms < 7 * 86_400_000) return WEEKDAYS[then.getDay()];
  return `${MONTHS[then.getMonth()]} ${then.getDate()}`;
}

export type TextPart = { text: string; href?: string; mention?: string };

/**
 * Splits a body into plain runs and links, for rendering without
 * dangerouslySetInnerHTML. Trailing punctuation stays prose: "see
 * https://nps.gov." links to nps.gov, not to "nps.gov.".
 */
export function splitLinks(body: string): TextPart[] {
  const out: TextPart[] = [];
  const re = /https?:\/\/[^\s<>"']+/g;
  let last = 0;
  for (let m = re.exec(body); m; m = re.exec(body)) {
    let url = m[0];
    while (/[.,;:!?)\]]$/.test(url)) url = url.slice(0, -1);
    if (m.index > last) out.push({ text: body.slice(last, m.index) });
    out.push({ text: url, href: url });
    last = m.index + url.length;
  }
  if (last < body.length) out.push({ text: body.slice(last) });
  return out;
}

/**
 * Links, plus @mentions resolved against the roster.
 *
 * A mention is only ever text — nothing is stored — so this matches what
 * people actually type against who is actually on the trip. The first real
 * chirp was "Here u go @molida", lowercase and unpunctuated, which is why the
 * match is case-insensitive and why an `@` naming nobody stays plain prose
 * rather than rendering as a broken tag.
 *
 * Names are tried longest-first so "Erin 🍀" wins over a bare "Erin", and the
 * emoji in that name is why this compares slices rather than using a word
 * boundary — Postgres and JS disagree about where one falls next to 🍀.
 */
/** Reaches the whole trip. "@everyone" is the one people reach for first. */
export const EVERYONE = "everyone";
const EVERYONE_ALIASES = ["everyone", "channel", "all", "here"];

export function splitBody(body: string, names: string[]): TextPart[] {
  const roster = [...names, ...EVERYONE_ALIASES]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const out: TextPart[] = [];
  for (const part of splitLinks(body)) {
    if (part.href) {
      out.push(part);
      continue;
    }
    const text = part.text;
    let last = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== "@") continue;
      const rest = text.slice(i + 1);
      const hit = roster.find(
        (n) => rest.slice(0, n.length).toLowerCase() === n.toLowerCase(),
      );
      if (!hit) continue;
      if (i > last) out.push({ text: text.slice(last, i) });
      out.push({ text: `@${rest.slice(0, hit.length)}`, mention: hit });
      i += hit.length;
      last = i + 1;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
  }
  return out;
}

/** Who a chirp tags, by roster name — or EVERYONE for an @everyone. */
export function mentionsIn(body: string, names: string[]): string[] {
  return [
    ...new Set(
      splitBody(body, names)
        .filter((p) => p.mention)
        .map((p) =>
          EVERYONE_ALIASES.includes(p.mention!) ? EVERYONE : p.mention!,
        ),
    ),
  ];
}

/** Does this chirp tag `me` — by name, or by tagging the whole trip? */
export function tagsPerson(body: string, names: string[], me: string): boolean {
  if (!me) return false;
  const tagged = mentionsIn(body, names);
  return tagged.includes(me) || tagged.includes(EVERYONE);
}
