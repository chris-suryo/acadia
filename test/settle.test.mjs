// Unit tests for the settle-up arithmetic.
//
// `lib/settle.ts` is the only place in this app where a bug costs somebody real
// money, and it is pure — no React, no database — so it can be checked directly
// rather than inferred from a browser. Run with `pnpm test:unit`.
//
// The module is TypeScript; Node's type stripping reads it as-is.

import test from "node:test";
import assert from "node:assert/strict";
import {
  audit,
  balances,
  explain,
  money,
  settle,
  shares,
  splitLedger,
  venmoLink,
} from "../lib/settle.ts";

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

// ---- settlements: paying someone back has to move the numbers ----

test("a settlement for the suggested amount squares that pair", () => {
  const ledger = [{ payer: "a", cents: 3000, among: ["a", "b", "c"] }];
  const [t] = settle(balances(ledger));
  const after = balances(ledger, [{ from: t.from, to: t.to, cents: t.cents }]);
  assert.equal(after.get(t.from) ?? 0, 0);
  assert.equal((after.get(t.to) ?? 0) < 3000 - t.cents + 1, true);
});

test("settling every suggested transfer clears the whole ledger", () => {
  const ledger = [
    { payer: "chris", cents: 24350, among: ["chris", "alana", "erin", "sam"] },
    { payer: "erin", cents: 4225, among: ["erin", "sam"] },
    { payer: "sam", cents: 1999, among: ["chris", "alana", "erin", "sam"] },
  ];
  const paid = settle(balances(ledger)).map((t) => ({
    from: t.from,
    to: t.to,
    cents: t.cents,
  }));
  assert.equal(balances(ledger, paid).size, 0, "nobody owes anybody");
  assert.deepEqual(settle(balances(ledger, paid)), []);
});

test("a partial payment leaves exactly the remainder", () => {
  const ledger = [{ payer: "a", cents: 10000, among: ["a", "b"] }];
  const after = balances(ledger, [{ from: "b", to: "a", cents: 2000 }]);
  assert.equal(after.get("b"), -3000, "owed 5000, paid 2000");
  assert.equal(after.get("a"), 3000);
});

test("overpaying flips the debt rather than going negative-zero", () => {
  const ledger = [{ payer: "a", cents: 10000, among: ["a", "b"] }];
  const after = balances(ledger, [{ from: "b", to: "a", cents: 8000 }]);
  assert.equal(after.get("b"), 3000, "b is now owed the excess");
  assert.equal(after.get("a"), -3000);
});

test("settlements between people with no expenses still balance", () => {
  const after = balances([], [{ from: "x", to: "y", cents: 500 }]);
  assert.equal(after.get("x"), 500);
  assert.equal(after.get("y"), -500);
  assert.equal([...after.values()].reduce((s, v) => s + v, 0), 0);
});

// ---- venmo links ----

test("venmo link carries the amount, the txn kind and the handle", () => {
  const u = new URL(venmoLink("pay", "chris-suryo", 8199));
  assert.equal(u.origin + u.pathname, "https://venmo.com/");
  assert.equal(u.searchParams.get("txn"), "pay");
  assert.equal(u.searchParams.get("amount"), "81.99");
  assert.equal(u.searchParams.get("recipients"), "chris-suryo");
  assert.equal(u.searchParams.get("audience"), "private");
});

test("venmo link tolerates a missing handle and a leading @", () => {
  assert.equal(
    new URL(venmoLink("charge", "", 500)).searchParams.get("recipients"),
    null,
    "no recipient rather than an empty one",
  );
  assert.equal(
    new URL(venmoLink("pay", "@erin", 500)).searchParams.get("recipients"),
    "erin",
  );
});

// ---- explaining the number ----
//
// The balance is only worth trusting if it can be unfolded, and an explanation
// that disagrees with the ledger is worse than none. These hold `explain`
// against `balances` rather than against a hand-written expectation.

const TRIP = (() => {
  // The real shape of this trip: one person fronts most of it, everything
  // splits twelve ways, and a couple of costs are only some people's.
  const ids = Array.from({ length: 12 }, (_, i) => `m${i}`);
  return {
    ids,
    expenses: [
      { id: "e1", description: "Campsite", payer: "m0", cents: 26155, among: ids },
      { id: "e2", description: "Hannaford", payer: "m0", cents: 8984, among: ids },
      { id: "e3", description: "Beer", payer: "m1", cents: 12000, among: ids },
      { id: "e4", description: "Gas", payer: "m0", cents: 10721, among: ["m0", "m2", "m3"] },
      { id: "e5", description: "Nobody's", payer: "m0", cents: 5000, among: [] },
    ],
  };
})();

test("explain's net agrees with balances, for every person", () => {
  const net = balances(TRIP.expenses);
  for (const id of TRIP.ids) {
    assert.equal(
      explain(TRIP.expenses, id).net,
      net.get(id) ?? 0,
      `${id} was explained a different number than they were charged`,
    );
  }
});

test("explain's lines add up to the totals it reports", () => {
  for (const id of TRIP.ids) {
    const e = explain(TRIP.expenses, id);
    assert.equal(sum(e.shareLines.map((l) => l.yours)), e.share);
    assert.equal(sum(e.paidLines.map((l) => l.total)), e.paid);
    assert.equal(e.net, e.paid - e.share + e.settled);
  }
});

test("explain leaves out expenses you were not on", () => {
  const gas = (id) => explain(TRIP.expenses, id).shareLines.find((l) => l.expenseId === "e4");
  assert.ok(gas("m2"), "a rider is charged for the gas");
  assert.equal(gas("m5"), undefined, "someone who didn't ride is not");
  assert.equal(gas("m2").ways, 3, "and the line says how many rode");
});

test("explain counts a settlement as movement, in the right direction", () => {
  const paid = [{ id: "s1", from: "m2", to: "m0", cents: 5000 }];
  const before = explain(TRIP.expenses, "m2").net;
  const after = explain(TRIP.expenses, "m2", paid);
  assert.equal(after.net, before + 5000, "paying back climbs toward zero");
  assert.equal(after.settledLines[0].direction, "out");
  assert.equal(explain(TRIP.expenses, "m0", paid).settledLines[0].direction, "in");
  assert.equal(
    after.net,
    balances(TRIP.expenses, paid).get("m2") ?? 0,
    "and still agrees with the ledger",
  );
});

// ---- auditing the whole trip ----

test("audit reports every person and cancels to zero", () => {
  const a = audit(TRIP.expenses, [], TRIP.ids);
  assert.equal(a.rows.length, 12);
  assert.ok(a.netsCancelToZero);
  assert.equal(sum(a.rows.map((r) => r.net)), 0);
});

test("audit catches money charged to nobody", () => {
  const a = audit(TRIP.expenses, [], TRIP.ids);
  assert.equal(a.total, 62860, "the group still spent it");
  assert.equal(a.charged, 57860, "but nobody owes it");
  assert.equal(a.chargedMatchesTotal, false);
  assert.deepEqual(a.unsplit.map((u) => u.id), ["e5"], "and it says which one");
});

test("audit on a sound ledger reports both invariants true", () => {
  const sound = TRIP.expenses.filter((e) => e.among.length > 0);
  const a = audit(sound, [], TRIP.ids);
  assert.ok(a.chargedMatchesTotal);
  assert.ok(a.netsCancelToZero);
  assert.equal(a.unsplit.length, 0);
});

test("the suggested payments clear exactly what audit says each person owes", () => {
  const sound = TRIP.expenses.filter((e) => e.among.length > 0);
  const a = audit(sound, [], TRIP.ids);
  const moved = new Map();
  for (const t of settle(balances(sound))) {
    moved.set(t.from, (moved.get(t.from) ?? 0) + t.cents);
    moved.set(t.to, (moved.get(t.to) ?? 0) - t.cents);
  }
  for (const r of a.rows) assert.equal(r.net + (moved.get(r.id) ?? 0), 0, `${r.id} left over`);
});

test("what you paid on an expense charged to nobody is held apart, not counted", () => {
  // `balances` skips it, so counting it in `paid` would explain a number the
  // ledger doesn't hold — but the payer still has to be told they're out of
  // pocket with no way to be repaid.
  const e = explain(TRIP.expenses, "m0");
  assert.equal(e.paidLines.some((l) => l.expenseId === "e5"), false);
  assert.deepEqual(e.unsplitPaid.map((l) => l.expenseId), ["e5"]);
  assert.equal(e.unsplitPaid[0].total, 5000);
});

// ---- the odd penny ----
//
// A real trip: seventeen expenses, twelve people, and almost none of the
// amounts divide evenly. Handing the spare cent to the front of the roster
// every single time made being early in the alphabet cost twelve cents.

test("the odd pennies rotate, so the same people aren't short every time", () => {
  const ids = Array.from({ length: 12 }, (_, i) => `m${String(i).padStart(2, "0")}`);
  const expenses = Array.from({ length: 17 }, (_, i) => ({
    id: `e${String(i).padStart(2, "0")}`,
    cents: 1000 + i * 777,
    among: ids,
  }));
  const split = splitLedger(expenses, ids);
  const totals = ids.map((id) =>
    [...split.values()].reduce((a, m) => a + (m.get(id) ?? 0), 0),
  );
  const spread = Math.max(...totals) - Math.min(...totals);
  assert.ok(spread <= 1, `spread of ${spread}¢ across the trip`);
});

test("every expense still splits base or base+1, and still adds up", () => {
  const ids = Array.from({ length: 12 }, (_, i) => `m${String(i).padStart(2, "0")}`);
  const expenses = Array.from({ length: 17 }, (_, i) => ({
    id: `e${String(i).padStart(2, "0")}`,
    cents: 1000 + i * 777,
    among: ids,
  }));
  for (const [id, m] of splitLedger(expenses, ids)) {
    const e = expenses.find((x) => x.id === id);
    assert.equal(sum([...m.values()]), e.cents, `${id} did not reconcile`);
    const base = Math.floor(e.cents / 12);
    for (const v of m.values())
      assert.ok(v === base || v === base + 1, `${id} paid ${v}, not ${base}/${base + 1}`);
  }
});

test("someone left off an expense is never dealt one of its pennies", () => {
  const ids = ["a", "b", "c", "d"];
  const expenses = Array.from({ length: 9 }, (_, i) => ({
    id: `e${i}`,
    cents: 1001 + i,
    among: i % 2 === 0 ? ids : ids.filter((x) => x !== "b"),
  }));
  for (const [id, m] of splitLedger(expenses, ids)) {
    const e = expenses.find((x) => x.id === id);
    if (!e.among.includes("b")) assert.equal(m.has("b"), false, `${id} charged b`);
  }
});

test("the split does not depend on what order the rows arrived in", () => {
  const ids = ["a", "b", "c", "d", "e"];
  const expenses = Array.from({ length: 11 }, (_, i) => ({
    id: `e${String(i).padStart(2, "0")}`,
    cents: 3333 + i * 101,
    among: ids,
  }));
  const forward = splitLedger(expenses, ids);
  const backward = splitLedger([...expenses].reverse(), ids);
  for (const id of forward.keys())
    assert.deepEqual([...forward.get(id)], [...backward.get(id)], `${id} moved`);
});
