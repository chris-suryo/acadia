/**
 * Who owes whom.
 *
 * Kept free of React and of the database so the arithmetic can be read, and
 * tested, on its own. Everything here is integer cents — money that round-trips
 * through a float eventually disagrees with itself, and a settle-up that
 * disagrees with itself is worse than no settle-up.
 */

export type Transfer = { from: string; to: string; cents: number };

/** `1234` → `"$12.34"`. Negatives keep the sign outside: `"-$12.34"`. */
export function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

/**
 * Split `cents` across `ids`, to the cent.
 *
 * `$10` three ways is `3.34 / 3.33 / 3.33`, not three times `3.33` with a
 * penny left over in nobody's column. The odd cents go to the first few ids in
 * the order given, so the same expense always splits the same way and the
 * shares always add back up to the total.
 */
export function shares(cents: number, ids: string[]): Map<string, number> {
  const out = new Map<string, number>();
  if (ids.length === 0) return out;
  const base = Math.floor(cents / ids.length);
  let extra = cents - base * ids.length;
  for (const id of ids) {
    out.set(id, base + (extra > 0 ? 1 : 0));
    if (extra > 0) extra--;
  }
  return out;
}

/**
 * Net position per person: what they paid out, less what they owe.
 * Positive means the group owes them; negative means they owe the group.
 *
 * People who neither paid nor owe anything are left out entirely — a roster of
 * twelve where two of you bought everything should settle between those two.
 */
export function balances(
  expenses: { payer: string; cents: number; among: string[] }[],
  settlements: { from: string; to: string; cents: number }[] = [],
): Map<string, number> {
  const net = new Map<string, number>();
  const bump = (id: string, by: number) => net.set(id, (net.get(id) ?? 0) + by);
  for (const e of expenses) {
    if (e.among.length === 0) continue;
    bump(e.payer, e.cents);
    for (const [id, owed] of shares(e.cents, e.among)) bump(id, -owed);
  }
  // Paying someone back is the same move as the transfer that was suggested,
  // so it cancels exactly: the debtor climbs toward zero, the creditor drops.
  for (const s of settlements) {
    bump(s.from, s.cents);
    bump(s.to, -s.cents);
  }
  for (const [id, v] of net) if (v === 0) net.delete(id);
  return net;
}

/**
 * The shortest list of payments that squares everyone up.
 *
 * Greedy — biggest creditor against biggest debtor, repeatedly. That isn't
 * provably minimal for every possible set of balances (the general problem is
 * NP-hard), but it never exceeds one payment fewer than there are people, and
 * for a dozen friends splitting groceries it lands on the obvious answer.
 */
export function settle(net: Map<string, number>): Transfer[] {
  // Sorted by id as a tiebreak so equal balances don't reorder between renders
  // and make the settle-up list flicker.
  const byId = (a: [string, number], b: [string, number]) =>
    a[0].localeCompare(b[0]);
  const cr = [...net]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || byId(a, b));
  const db = [...net]
    .filter(([, v]) => v < 0)
    .sort((a, b) => a[1] - b[1] || byId(a, b));

  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < cr.length && j < db.length) {
    const amt = Math.min(cr[i][1], -db[j][1]);
    if (amt > 0) out.push({ from: db[j][0], to: cr[i][0], cents: amt });
    cr[i][1] -= amt;
    db[j][1] += amt;
    if (cr[i][1] === 0) i++;
    if (db[j][1] === 0) j++;
  }
  return out;
}

/**
 * A Venmo link that opens the app with the amount already in it.
 *
 * The https form is a universal link: iOS hands it to the Venmo app when it's
 * installed and falls back to the web page when it isn't, which beats sniffing
 * for a custom scheme and stranding anyone it guesses wrong about.
 *
 * `handle` is optional — without it Venmo opens on its own people picker, which
 * still saves typing the amount and is better than nothing while the roster is
 * half filled in.
 */
export function venmoLink(
  txn: "pay" | "charge",
  handle: string,
  cents: number,
  note = "Acadia Base Camp",
): string {
  const q = new URLSearchParams({
    txn,
    audience: "private",
    amount: (cents / 100).toFixed(2),
    note,
  });
  const who = handle.trim().replace(/^@/, "");
  if (who) q.set("recipients", who);
  return `https://venmo.com/?${q.toString()}`;
}
