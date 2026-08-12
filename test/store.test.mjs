// Folding a shopping list down to one line per thing.
//
// The failure this prevents is quiet: you tick the salsa, walk on, and walk
// past the other salsa. There are no quantities on the list any more — the
// numbers were invented from a party size and whoever shops works them out
// better in the aisle — so this only has to recognise the same product twice.

import test from "node:test";
import assert from "node:assert/strict";
import { mergeLines, productKey, productName } from "../lib/store.ts";

const rows = (...labels) =>
  labels.map((label, i) => ({ id: `r${i}`, label, checked: false }));
const labels = (merged) => merged.map((m) => m.label);

test("a hand-typed quantity doesn't make a second product", () => {
  assert.equal(productName("Bananas ×2"), "Bananas");
  assert.equal(productName("Ground beef 4 lb"), "Ground beef");
  assert.equal(productName("Salsa ×2 jars"), "Salsa");
  // Nothing to strip — and a name with no quantity is left exactly alone.
  assert.equal(productName("Mayo + mustard"), "Mayo + mustard");
  assert.equal(productName("Lettuce"), "Lettuce");
});

test("singular and plural are the same product", () => {
  assert.equal(productKey("Onion"), productKey("Onions"));
  assert.equal(productKey("Bell peppers"), productKey("bell pepper"));
  // A double s isn't a plural — and the key only has to group, not read back.
  assert.equal(productKey("Hummus"), productKey("hummus"));
  assert.notEqual(productKey("Eggs"), productKey("Egg noodles"));
});

test("the same thing asked for by two dishes becomes one line", () => {
  assert.deepEqual(labels(mergeLines(rows("Tortillas", "Tortillas", "Tortillas"))), [
    "Tortillas",
  ]);
  assert.deepEqual(labels(mergeLines(rows("Onion", "Onions"))), ["Onion"]);
  assert.deepEqual(labels(mergeLines(rows("Shredded cheese", "Shredded cheese"))), [
    "Shredded cheese",
  ]);
});

test("a typed quantity folds into the plain line, and the plain one shows", () => {
  // Someone adds "Bananas ×2" under Produce; the menu already wants bananas.
  assert.deepEqual(labels(mergeLines(rows("Bananas", "Bananas ×2"))), ["Bananas"]);
  assert.deepEqual(labels(mergeLines(rows("Ground beef 4 lb", "Ground beef"))), [
    "Ground beef",
  ]);
});

test("different things stay different", () => {
  assert.deepEqual(labels(mergeLines(rows("Limes", "Lemons"))), ["Limes", "Lemons"]);
  assert.deepEqual(labels(mergeLines(rows("Cheese slices", "Shredded cheese"))), [
    "Cheese slices",
    "Shredded cheese",
  ]);
});

test("order of first appearance is kept, so the aisle order survives", () => {
  assert.deepEqual(
    labels(mergeLines(rows("Bacon", "Eggs", "Bacon", "Bread"))),
    ["Bacon", "Eggs", "Bread"],
  );
});

test("a merged line is only bought once every part of it is", () => {
  const merged = mergeLines([
    { id: "a", label: "Tortillas", checked: true },
    { id: "b", label: "Tortillas", checked: false },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].checked, false, "one of the two is still on the shelf");
  assert.deepEqual(
    merged[0].rows.map((r) => r.id),
    ["a", "b"],
    "both rows ride along, so ticking the line ticks the dishes behind it",
  );
});
