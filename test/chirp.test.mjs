// Chirp's clock and linkifier.
//
// The clock's cases matter because eleven phones disagree about the time:
// a post stamped slightly in the future is clock skew, not time travel.

import test from "node:test";
import assert from "node:assert/strict";
import { chirpTime, splitLinks } from "../lib/chirp.ts";

const NOW = new Date("2026-08-14T18:00:00Z");
const at = (iso) => chirpTime(iso, NOW);

test("the relative clock: now → minutes → hours → weekday → date", () => {
  assert.equal(at("2026-08-14T17:59:30Z"), "now");
  assert.equal(at("2026-08-14T17:56:00Z"), "4m");
  assert.equal(at("2026-08-14T16:00:00Z"), "2h");
  assert.equal(at("2026-08-14T18:00:20Z"), "now"); // skewed clock, not time travel
  assert.equal(at("2026-08-12T18:00:00Z"), "Wed"); // two days back, same week
  assert.equal(at("2026-08-03T12:00:00Z"), "Aug 3"); // beyond a week
});

test("boundaries land on the right side", () => {
  assert.equal(at("2026-08-14T17:59:01Z"), "now"); // 59s
  assert.equal(at("2026-08-14T17:59:00Z"), "1m"); // exactly a minute
  assert.equal(at("2026-08-14T17:01:00Z"), "59m");
  assert.equal(at("2026-08-14T17:00:00Z"), "1h");
  assert.equal(at("2026-08-13T18:00:01Z"), "23h");
});

test("links come out tappable, prose stays prose", () => {
  assert.deepEqual(splitLinks("no links here"), [{ text: "no links here" }]);
  assert.deepEqual(splitLinks("see https://nps.gov/acad for maps"), [
    { text: "see " },
    { text: "https://nps.gov/acad", href: "https://nps.gov/acad" },
    { text: " for maps" },
  ]);
});

test("trailing punctuation is the sentence's, not the link's", () => {
  assert.deepEqual(splitLinks("go here: https://nps.gov."), [
    { text: "go here: " },
    { text: "https://nps.gov", href: "https://nps.gov" },
    { text: "." },
  ]);
  const paren = splitLinks("(https://a.b/c)");
  assert.deepEqual(paren[1], { text: "https://a.b/c", href: "https://a.b/c" });
});

test("two links in one chirp both resolve", () => {
  const parts = splitLinks("https://a.com and http://b.com");
  assert.equal(parts.filter((p) => p.href).length, 2);
  assert.equal(parts[1].text, " and ");
});
