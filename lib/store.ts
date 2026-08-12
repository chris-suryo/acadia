/**
 * One line per thing you put in the cart.
 *
 * Ingredients are written per dish, which is right for the menu and wrong for
 * the shop: tortillas belong to five different dishes, shredded cheese to four,
 * bell peppers to three. Left alone that's the same product met three separate
 * times in one aisle, each with a different number next to it, and no way to
 * know whether you already picked it up.
 *
 * So the store list adds them up. "Eggs ×24" and "Eggs ×36" become "Eggs ×60";
 * "Onion ×2" and "Onions ×3" become "Onions ×5". Quantities only combine when
 * they're in the same units — "Cheese slices 1 lb" and "Cheese slices ×16" are
 * two different things to buy and stay two lines.
 */

/** A quantity pulled off the end of a label, and how it was written. */
type Qty =
  | { style: "count"; n: number; unit: string }
  | { style: "weight"; n: number; unit: string }
  | null;

const WEIGHT = /^(.*?)\s+(\d+(?:\.\d+)?)\s*(lbs?|oz|qt|gal|kg|g)\b\s*$/i;
const COUNT = /^(.*?)\s*[×x]\s*(\d+)\s*(.*)$/;

/** Splits "Salsa ×2 jars" into "Salsa" and 2 jars. Anything unparseable keeps
 *  its whole label as the name, which is what you want for "Mayo + mustard". */
export function parseLine(label: string): { name: string; qty: Qty } {
  const w = WEIGHT.exec(label);
  if (w && w[1].trim()) {
    return {
      name: w[1].trim(),
      // "lbs" and "lb" are the same shelf.
      qty: { style: "weight", n: parseFloat(w[2]), unit: w[3].toLowerCase().replace(/s$/, "") },
    };
  }
  const c = COUNT.exec(label);
  if (c && c[1].trim()) {
    return {
      name: c[1].trim(),
      qty: { style: "count", n: parseInt(c[2], 10), unit: c[3].trim().toLowerCase() },
    };
  }
  return { name: label.trim(), qty: null };
}

/**
 * The key two lines have to share to be the same product.
 *
 * A trailing plural is dropped so "Onion" and "Onions" land together. Words
 * ending in a double s keep it — this never has to read back, it only has to
 * group, so being slightly wrong about English costs nothing as long as it's
 * wrong the same way every time.
 */
export function productKey(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .join(" ");
}

export function formatLine(name: string, qty: Qty): string {
  if (!qty) return name;
  if (qty.style === "weight") return `${name} ${+qty.n.toFixed(2)} ${qty.unit}`;
  return `${name} ×${qty.n}${qty.unit ? ` ${qty.unit}` : ""}`;
}

export type Mergeable = { id: string; label: string; checked: boolean };

export type MergedLine<T extends Mergeable> = {
  /** The summed label, e.g. "Eggs ×60". */
  label: string;
  /** Every row folded into this one. Ticking the line ticks all of them —
   *  you bought the tortillas, so all five dishes have their tortillas. */
  rows: T[];
  /** Only true when every underlying row is checked. */
  checked: boolean;
};

/**
 * Folds same-product rows together, keeping the order of first appearance.
 *
 * Rows whose quantities can't be combined (different units, or no quantity at
 * all) stay separate, so nothing is silently lost or invented.
 */
export function mergeLines<T extends Mergeable>(rows: T[]): MergedLine<T>[] {
  const out: MergedLine<T>[] = [];
  const at = new Map<string, number>();

  for (const row of rows) {
    const { name, qty } = parseLine(row.label);
    // Unit is part of the key: jars don't add to pounds. But "1 jar" and
    // "5 jars" are the same shelf, so the unit is de-pluralised for matching
    // the same way the name is.
    const key = `${productKey(name)}|${qty ? `${qty.style}:${productKey(qty.unit)}` : "none"}`;
    const seen = at.get(key);

    if (seen === undefined) {
      at.set(key, out.length);
      out.push({ label: row.label, rows: [row], checked: row.checked });
      continue;
    }

    const line = out[seen];
    line.rows.push(row);
    line.checked = line.checked && row.checked;
    if (qty) {
      const first = parseLine(line.label);
      // The plural spelling wins the display — "Onions ×5", not "Onion ×5".
      const shown = name.length > first.name.length ? name : first.name;
      const unit =
        (qty.unit.length > (first.qty?.unit.length ?? 0) ? qty.unit : first.qty?.unit) ?? "";
      line.label = formatLine(shown, {
        ...qty,
        unit,
        n: (first.qty?.n ?? 0) + qty.n,
      });
    }
  }

  return out;
}
