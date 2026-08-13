// Writes that wait for signal.
//
// The invariants here are the ones a campsite actually exercises: order is
// preserved, a lost network holds the whole queue, and a write the server
// refuses doesn't wedge everything behind it forever.

import test from "node:test";
import assert from "node:assert/strict";
import { createOutbox } from "../lib/outbox.ts";

const ok = () => Promise.resolve({ error: null });
const refused = () => Promise.resolve({ error: { message: "constraint" } });
const offline = () => Promise.reject(new TypeError("Failed to fetch"));

const make = () => {
  const errors = [];
  const sizes = [];
  const box = createOutbox({
    onServerError: (table, e) => errors.push([table, e]),
    onSizeChange: (n) => sizes.push(n),
  });
  return { box, errors, sizes };
};

test("an empty queue drains to nothing", async () => {
  const { box } = make();
  await box.flush();
  assert.equal(box.size(), 0);
});

test("queued writes land in the order they were made", async () => {
  const { box } = make();
  const order = [];
  for (const n of [1, 2, 3])
    box.push({ make: () => (order.push(n), ok()), table: "gear_claims" });
  assert.equal(box.size(), 3);
  await box.flush();
  assert.deepEqual(order, [1, 2, 3]);
  assert.equal(box.size(), 0);
  assert.deepEqual(box.drained(), ["gear_claims"]);
});

test("no signal holds the queue, and everything behind it", async () => {
  const { box } = make();
  const tried = [];
  box.push({ make: () => (tried.push("a"), ok()), table: "t" });
  box.push({ make: () => (tried.push("b"), offline()), table: "t" });
  box.push({ make: () => (tried.push("c"), ok()), table: "t" });
  await box.flush();
  // "a" landed; "b" never reached the server, so "c" must not overtake it.
  assert.deepEqual(tried, ["a", "b"]);
  assert.equal(box.size(), 2);
});

test("signal coming back drains the rest, still in order", async () => {
  const { box } = make();
  const tried = [];
  let up = false;
  box.push({ make: () => (tried.push("a"), up ? ok() : offline()), table: "t" });
  box.push({ make: () => (tried.push("b"), ok()), table: "t" });
  await box.flush();
  assert.equal(box.size(), 2, "both still waiting");
  up = true;
  await box.flush();
  assert.deepEqual(tried, ["a", "a", "b"], "the held one is retried first");
  assert.equal(box.size(), 0);
});

test("a write the server refuses is reported and does not wedge the queue", async () => {
  const { box, errors } = make();
  const tried = [];
  box.push({ make: () => (tried.push("bad"), refused()), table: "personal_items" });
  box.push({ make: () => (tried.push("good"), ok()), table: "gear_items" });
  await box.flush();
  assert.deepEqual(tried, ["bad", "good"], "the good one still goes");
  assert.equal(box.size(), 0);
  assert.equal(errors.length, 1);
  assert.equal(errors[0][0], "personal_items");
});

test("a refused write is never retried", async () => {
  const { box } = make();
  let attempts = 0;
  box.push({ make: () => (attempts++, refused()), table: "t" });
  await box.flush();
  await box.flush();
  assert.equal(attempts, 1, "retrying a refusal would fail identically forever");
});

test("the size is reported as it changes, so the UI can say so", async () => {
  const { box, sizes } = make();
  box.push({ make: offline, table: "t" });
  box.push({ make: ok, table: "t" });
  assert.deepEqual(sizes, [1, 2]);
  await box.flush();
  assert.equal(sizes.at(-1), 2, "still waiting — nothing landed");
});

test("two drains at once don't double-send", async () => {
  const { box } = make();
  let sent = 0;
  box.push({
    make: () =>
      new Promise((r) => setTimeout(() => (sent++, r({ error: null })), 10)),
    table: "t",
  });
  await Promise.all([box.flush(), box.flush()]);
  assert.equal(sent, 1);
});
