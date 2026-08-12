// Unit tests for the settle-up arithmetic.
//
// `lib/settle.ts` is the only place in this app where a bug costs somebody real
// money, and it is pure — no React, no database — so it can be checked directly
// rather than inferred from a browser. Run with `pnpm test:unit`.
//
// The module is TypeScript; Node's type stripping reads it as-is.

import test from "node:test";
import assert from "node:assert/strict";
import { balances, money, settle, shares } from "../lib/settle.ts";

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

test("money formats cents, keeping the sign outside the symbol", () => {
  assert.equal(money(0), "$0.00");
  assert.equal(money(1234), "$12.34");
  assert.equal(money(5), "$0.05");
  assert.equal(money(-1234), "-$12.34");
});

test("shares always add back up to the total", () => {
  for (const cents of [0, 1, 2, 7, 100, 1000, 24350, 999999]) {
    for (const n of [1, 2, 3, 7, 11, 12]) {
      const ids = Array.from({ length: n }, (_, i) => `m${i}`);
      const out = shares(cents, ids);
      assert.equal(out.size, n, `${cents} across ${n} lost a person`);
      assert.equal(
        sum([...out.values()]),
        cents,
        `${cents} across ${n} did not reconcile`,
      );
    }
  }
});

test("odd cents go to the front of the given order, one each", () => {
  // $10 three ways is 3.34 / 3.33 / 3.33 — not three times 3.33 with a penny
  // sitting in nobody's column.
  assert.deepEqual([...shares(1000, ["a", "b", "c"]).values()], [334, 333, 333]);
  // Seven odd cents across eleven: the first seven carry one extra.
  const eleven = [...shares(24350, Array.from({ length: 11 }, (_, i) => `m${i}`)).values()];
  assert.equal(sum(eleven), 24350);
  assert.deepEqual(eleven.slice(0, 7), Array(7).fill(2214));
  assert.deepEqual(eleven.slice(7), Array(4).fill(2213));
});

test("shares of nobody is empty, not a division by zero", () => {
  assert.equal(shares(1000, []).size, 0);
});

test("balances nets what you paid against what you owe", () => {
  const net = balances([{ payer: "a", cents: 3000, among: ["a", "b", "c"] }]);
  assert.equal(net.get("a"), 2000);
  assert.equal(net.get("b"), -1000);
  assert.equal(net.get("c"), -1000);
  assert.equal(sum([...net.values()]), 0, "a ledger must close");
});

test("balances leaves out people who neither paid nor owe", () => {
  // Two people bought everything for themselves; a roster of twelve should not
  // produce ten columns of zero.
  const net = balances([{ payer: "a", cents: 1000, among: ["a"] }]);
  assert.equal(net.size, 0);
});

test("balances ignores an expense split with nobody", () => {
  // The UI refuses to write one of these, but the arithmetic must not invent a
  // debt for a payer with no counterparties either.
  const net = balances([{ payer: "a", cents: 5000, among: [] }]);
  assert.equal(net.size, 0);
});

test("settle clears the ledger exactly", () => {
  const ledger = [
    { payer: "chris", cents: 24350, among: ["chris", "erin", "alana", "pat"] },
    { payer: "erin", cents: 4225, among: ["erin", "pat"] },
    { payer: "alana", cents: 1899, among: ["chris", "erin", "alana", "pat"] },
  ];
  const net = balances(ledger);
  const transfers = settle(net);
  const moved = new Map();
  for (const t of transfers) {
    moved.set(t.from, (moved.get(t.from) ?? 0) - t.cents);
    moved.set(t.to, (moved.get(t.to) ?? 0) + t.cents);
  }
  // A creditor receives exactly what they were owed; a debtor pays exactly what
  // they owed. Either way the payments cancel the position to zero.
  for (const [id, owed] of net) {
    assert.equal(moved.get(id) ?? 0, owed, `${id} is not squared up`);
  }
  assert.equal(sum(transfers.map((t) => t.cents)) > 0, true);
});

test("settle never needs more payments than there are people, less one", () => {
  const net = new Map([
    ["a", 5000], ["b", 3000], ["c", -1000],
    ["d", -2000], ["e", -2500], ["f", -2500],
  ]);
  assert.equal(settle(net).length <= net.size - 1, true);
});

test("settle on a square ledger asks nobody for anything", () => {
  assert.deepEqual(settle(new Map()), []);
  assert.deepEqual(settle(balances([{ payer: "a", cents: 1000, among: ["a"] }])), []);
});

test("settle is stable — equal balances do not reorder between renders", () => {
  const net = () => new Map([["a", 2000], ["b", -1000], ["c", -1000]]);
  assert.deepEqual(settle(net()), settle(net()));
});

test("every transfer moves a positive amount", () => {
  const net = balances([
    { payer: "a", cents: 100, among: ["a", "b", "c"] },
    { payer: "b", cents: 100, among: ["a", "b", "c"] },
    { payer: "c", cents: 100, among: ["a", "b", "c"] },
  ]);
  for (const t of settle(net)) assert.equal(t.cents > 0, true);
});
