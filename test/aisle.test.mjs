// Which part of the store a line belongs in.
//
// Pure and boring, but a line filed in the wrong aisle is one you walk past.
// Every case below is a real ingredient off the menu that landed in the wrong
// half of the store — none of them showed up until the votes started producing
// an actual list.

import test from "node:test";
import assert from "node:assert/strict";
import { aisleOf } from "../lib/aisle.ts";

test("the container a thing comes in doesn't decide the aisle", () => {
  assert.equal(aisleOf("Marshmallows ×3 bags"), "Dry + Snacks");
  assert.equal(aisleOf("Tortilla chips ×4 bags"), "Dry + Snacks");
  assert.equal(aisleOf("Trail mix ×4 bags"), "Dry + Snacks");
  assert.equal(aisleOf("Beer ×3 cases"), "Drinks");
  assert.equal(aisleOf("Salsa ×2 jars"), "Dry + Snacks");
});

test("a substring is not a match — chocolate is not a cola", () => {
  assert.equal(aisleOf("Chocolate bars ×12"), "Dry + Snacks");
  assert.equal(aisleOf("Coca-Cola ×2"), "Drinks");
});

test("what a thing is made of isn't where it's kept", () => {
  // Buns at the meat counter, tortillas with the chips: two laps of the store.
  assert.equal(aisleOf("Burger buns ×16"), "Bakery");
  assert.equal(aisleOf("Hot dog buns ×24"), "Bakery");
  assert.equal(aisleOf("Tortillas ×24"), "Bakery");
  assert.equal(aisleOf("Burger patties ×16"), "Meat + Deli");
  assert.equal(aisleOf("Hot dogs ×24"), "Meat + Deli");
  // Shelf-stable, so it's a snack, not something from the butcher.
  assert.equal(aisleOf("Beef jerky ×4 bags"), "Dry + Snacks");
  assert.equal(aisleOf("Ground beef 3 lb"), "Meat + Deli");
});

test("a tin of vegetables is not a vegetable", () => {
  assert.equal(aisleOf("Crushed tomatoes ×4"), "Dry + Snacks");
  assert.equal(aisleOf("Canned beans ×6"), "Dry + Snacks");
  assert.equal(aisleOf("Tomatoes ×6"), "Produce");
});

test("a boxed mix is a box, whatever it becomes at camp", () => {
  assert.equal(aisleOf("Cornbread mix ×3"), "Dry + Snacks");
  assert.equal(aisleOf("Pancake mix ×2 boxes"), "Dry + Snacks");
  assert.equal(aisleOf("Bread ×3 loaves"), "Bakery");
});

test("condiments and spices have a home", () => {
  // These all fell to Other, which sorts last — past the exit.
  assert.equal(aisleOf("Ketchup, mustard, relish"), "Dry + Snacks");
  assert.equal(aisleOf("Mayo + mustard"), "Dry + Snacks");
  assert.equal(aisleOf("Chili powder + cumin"), "Dry + Snacks");
  assert.equal(aisleOf("Taco seasoning ×3"), "Dry + Snacks");
  assert.equal(aisleOf("Hummus ×3 tubs"), "Dairy + Eggs");
  assert.equal(aisleOf("Spinach ×1 bag"), "Produce");
});

test("weights are stripped before matching", () => {
  assert.equal(aisleOf("Ground beef 4 lb"), "Meat + Deli");
  assert.equal(aisleOf("Butter 1 lb"), "Dairy + Eggs");
  assert.equal(aisleOf("Coffee 2 lb"), "Drinks");
});

test("the aisles people actually shop", () => {
  assert.equal(aisleOf("Eggs ×36"), "Dairy + Eggs");
  assert.equal(aisleOf("Bagels ×24"), "Bakery");
  assert.equal(aisleOf("Bell peppers ×8"), "Produce");
  assert.equal(aisleOf("Ice — restock Saturday"), "Ice + Frozen");
  assert.equal(aisleOf("Foil, ziplocks, paper towels"), "Household");
  assert.equal(aisleOf("Deli turkey 2 lb"), "Meat + Deli");
});

test("something unrecognised falls to Other rather than guessing", () => {
  assert.equal(aisleOf("Whatever Molida wants"), "Other");
});
