/**
 * One line per thing you put in the cart.
 *
 * Ingredients are written per dish, which is right for the menu and wrong for
 * the shop: tortillas belong to two dishes on the plan, shredded cheese to
 * three. Left alone that's the same product met three separate times in one
 * aisle, with no way to know whether you already picked it up.
 *
 * The list carries no quantities — it says lettuce, not "lettuce ×2 heads",
 * because the number was invented from a party size and whoever is shopping
 * works it out better in the aisle. So folding is just a matter of recognising
 * the same product twice: nothing is added up, and nothing can be added up
 * wrongly.
 */

const WEIGHT = /^(.*?)\s+\d+(?:\.\d+)?\s*(?:lbs?|ozs?|qt|gal|kg|g)\s*$/i;
const COUNT = /^(.*?)\s*[×x]\s*\d+.*$/;

/**
 * The product, with any quantity someone typed taken off the end.
 *
 * Seeded lines have no quantity at all, but a person adding a line will write
 * "Bananas ×2" as often as "Bananas", and those are one thing to buy.
 */
export function productName(label: string): string {
  const w = WEIGHT.exec(label);
  if (w && w[1].trim()) return w[1].trim();
  const c = COUNT.exec(label);
  if (c && c[1].trim()) return c[1].trim();
  return label.trim();
}

/**
 * The key two lines have to share to be the same product.
 *
 * A trailing plural is dropped so "Onion" and "Onions" land together. Words
 * ending in a double s keep it — this never has to read back, it only has to
 * group, so being slightly wrong about English costs nothing as long as it's
 * wrong the same way every time.
 */
export function productKey(label: string): string {
  return productName(label)
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .join(" ");
}

export type Mergeable = { id: string; label: string; checked: boolean };

export type MergedLine<T extends Mergeable> = {
  label: string;
  /** Every row folded into this one. Ticking the line ticks all of them —
   *  you bought the tortillas, so both dishes have their tortillas. */
  rows: T[];
  /** Only true when every underlying row is checked. */
  checked: boolean;
};

/**
 * Folds same-product rows together, keeping the order of first appearance so
 * the aisle order survives. The shortest spelling wins the label, which is the
 * seeded one whenever a hand-typed quantity collides with it.
 */
export function mergeLines<T extends Mergeable>(rows: T[]): MergedLine<T>[] {
  const out: MergedLine<T>[] = [];
  const at = new Map<string, number>();

  for (const row of rows) {
    const key = productKey(row.label);
    const seen = at.get(key);

    if (seen === undefined) {
      at.set(key, out.length);
      out.push({ label: row.label, rows: [row], checked: row.checked });
      continue;
    }

    const line = out[seen];
    line.rows.push(row);
    line.checked = line.checked && row.checked;
    if (row.label.length < line.label.length) line.label = row.label;
  }

  return out;
}
