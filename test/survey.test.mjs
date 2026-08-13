// One person's answer, assembled from every device they used.
//
// Every case here is a real row shape off the live trip: two people had added
// the app to a Home Screen, which gives iOS a second anonymous identity, and
// the questionnaire followed them there only halfway.

import test from "node:test";
import assert from "node:assert/strict";
import { mergeSurvey, surveysByPerson } from "../lib/survey.ts";

const row = (o) => ({
  user_id: "d1",
  activity: "",
  hikes: "",
  wants: "",
  bar_harbor: "",
  food: "",
  updated_at: "2026-08-13T00:00:00Z",
  ...o,
});

test("a single device is left exactly as it is", () => {
  const only = row({ activity: "One good hike", wants: "Swimming" });
  assert.deepEqual(mergeSurvey([only]), only);
  assert.equal(mergeSurvey([]), undefined);
});

test("two devices holding complementary halves make one whole answer", () => {
  // Alana's real pair: pace on the newer device, vibes on the older one.
  const merged = mergeSurvey([
    row({ user_id: "old", wants: "A big hike · Swimming", bar_harbor: "Done it a bit", updated_at: "2026-08-13T10:00:00Z" }),
    row({ user_id: "new", activity: "One good hike", updated_at: "2026-08-13T12:00:00Z" }),
  ]);
  assert.equal(merged.activity, "One good hike");
  assert.equal(merged.wants, "A big hike · Swimming");
  assert.equal(merged.bar_harbor, "Done it a bit");
  // The newest device owns the card, so its avatar is the one that renders.
  assert.equal(merged.user_id, "new");
});

test("when both devices answered the same field, the newer one wins", () => {
  const merged = mergeSurvey([
    row({ wants: "Easy walks", updated_at: "2026-08-11T00:00:00Z" }),
    row({ wants: "A big hike", updated_at: "2026-08-13T00:00:00Z" }),
  ]);
  assert.equal(merged.wants, "A big hike");
});

test("a tally counts people, not phones", () => {
  // Molida answered fully on both devices; she is one vote, not two.
  const people = surveysByPerson(
    [
      row({ user_id: "molida-a", wants: "Swimming", updated_at: "2026-08-13T03:23:00Z" }),
      row({ user_id: "molida-b", wants: "Swimming", updated_at: "2026-08-13T03:30:00Z" }),
      row({ user_id: "erin", wants: "Swimming", updated_at: "2026-08-11T21:21:00Z" }),
    ],
    (uid) => (uid.startsWith("molida") ? "m-molida" : "m-erin"),
  );
  assert.equal(people.length, 2);
});

test("a device nobody has claimed still counts as its own person", () => {
  // memberOf returns '' for an unlinked device; falling back to the row's own
  // id keeps that answer on the board instead of collapsing every stranger
  // into a single phantom person.
  const people = surveysByPerson(
    [row({ user_id: "loose-a", wants: "Swimming" }), row({ user_id: "loose-b", wants: "Easy walks" })],
    () => "",
  );
  assert.equal(people.length, 2);
});
