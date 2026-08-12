// Adding up a shopping list.
//
// The failure this prevents is quiet and expensive: you walk past the eggs
// because the line you ticked was the other eggs, or you buy five jars of
// salsa twice. Every case below is a real pair off the menu.

import test from "node:test";
import assert from "node:assert/strict";
import { mergeLines, parseLine, productKey, formatLine } from "../lib/store.ts";

const rows = (...labels) =>
  labels.map((label, i) => ({ id: `r${i}`, label, checked: false }));
const labels = (merged) => merged.map((m) => m.label);

test("a quantity is read off the end, whichever way it's written", () => {
  assert.deepEqual(parseLine("Tortillas ×24"), {
    name: "Tortillas",
    qty: { style: "count", n: 24, unit: "" },
  });
  assert.deepEqual(parseLine("Salsa ×2 jars"), {
    name: "Salsa",
    qty: { style: "count", n: 2, unit: "jars" },
  });
  assert.deepEqual(parseLine("Ground beef 4 lb"), {
    name: "Ground beef",
    qty: { style: "weight", n: 4, unit: "lb" },
  });
  // Nothing to parse: the whole label is the name, and it never gets summed.
  assert.deepEqual(parseLine("Mayo + mustard"), {
    name: "Mayo + mustard",
    qty: null,
  });
});

test("singular and plural are the same product", () => {
  assert.equal(productKey("Onion"), productKey("Onions"));
  assert.equal(productKey("Bell peppers"), productKey("bell pepper"));
  // A double s isn't a plural — and the key only has to group, not read back.
  assert.equal(productKey("Hummus"), productKey("hummus"));
  assert.notEqual(productKey("Eggs"), productKey("Egg noodles"));
});

test("the same thing asked for by two dishes becomes one line", () => {
  assert.deepEqual(labels(mergeLines(rows("Eggs ×24", "Eggs ×36"))), ["Eggs ×60"]);
  assert.deepEqual(labels(mergeLines(rows("Onion ×2", "Onions ×3"))), ["Onions ×5"]);
  assert.deepEqual(
    labels(mergeLines(rows("Shredded cheese 1 lb", "Shredded cheese 2 lb"))),
    ["Shredded cheese 3 lb"],
  );
  assert.deepEqual(labels(mergeLines(rows("Salsa ×2 jars", "Salsa ×3 jars"))), [
    "Salsa ×5 jars",
  ]);
  // Five dishes want tortillas. You buy tortillas once.
  assert.deepEqual(
    labels(mergeLines(rows("Tortillas ×24", "Tortillas ×24", "Tortillas ×24"))),
    ["Tortillas ×72"],
  );
});

test("what can't be added up stays apart", () => {
  // Sliced cheese by weight and by the slice are two different buys.
  assert.deepEqual(
    labels(mergeLines(rows("Cheese slices 1 lb", "Cheese slices ×16"))),
    ["Cheese slices 1 lb", "Cheese slices ×16"],
  );
  // No quantity to combine — one line, not a phantom sum.
  assert.deepEqual(
    labels(mergeLines(rows("Chili powder + cumin", "Chili powder + cumin"))),
    ["Chili powder + cumin"],
  );
  assert.deepEqual(labels(mergeLines(rows("Limes ×6", "Lemons ×6"))), [
    "Limes ×6",
    "Lemons ×6",
  ]);
});

test("order of first appearance is kept, so the aisle order survives", () => {
  assert.deepEqual(
    labels(mergeLines(rows("Bacon 3 lb", "Eggs ×24", "Bacon 2 lb", "Bread ×3 loaves"))),
    ["Bacon 5 lb", "Eggs ×24", "Bread ×3 loaves"],
  );
});

test("a merged line is only bought once every part of it is", () => {
  const merged = mergeLines([
    { id: "a", label: "Eggs ×24", checked: true },
    { id: "b", label: "Eggs ×36", checked: false },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].checked, false, "one of the two is still on the shelf");
  assert.deepEqual(
    merged[0].rows.map((r) => r.id),
    ["a", "b"],
    "both rows ride along, so ticking the line ticks the dishes behind it",
  );
});

test("fractions survive the round trip", () => {
  assert.equal(formatLine("Butter", { style: "weight", n: 1.5, unit: "lb" }), "Butter 1.5 lb");
  assert.deepEqual(labels(mergeLines(rows("Butter 0.5 lb", "Butter 1 lb"))), [
    "Butter 1.5 lb",
  ]);
});
