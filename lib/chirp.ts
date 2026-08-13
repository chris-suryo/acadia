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
 * Clocks on eleven phones disagree; a post from three seconds in the future
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

export type TextPart = { text: string; href?: string };

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
