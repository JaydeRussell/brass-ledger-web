import { test } from "node:test";
import assert from "node:assert/strict";
import { eventDateParts, formatDateRange } from "./eventDates.ts";

test("eventDateParts: a bare YYYY-MM-DD is taken literally, with no timezone conversion", () => {
  assert.deepEqual(eventDateParts("2026-01-01"), { year: 2026, month: 1, day: 1 });
});

test("eventDateParts: a full ISO timestamp resolves to the viewer's own local calendar date, not the raw UTC date digits", () => {
  // The real bug this guards against: BCP sometimes publishes a full
  // instant (not a bare date) for an event's end — e.g. 6pm the evening
  // before in a US timezone, serialized as midnight UTC the *following*
  // day (confirmed against a real Challengers Cup 2026 event whose
  // published end was "2026-09-14T00:00:00.000Z" but which actually
  // concluded Sep 13). Taking "14" straight off the string (as a bare
  // date's digits would be) claims the event ran a day longer than it
  // did. The correct reading is whatever `new Date` + local getters
  // say — this proves eventDateParts defers to that for non-bare-date
  // input instead of a naive string-prefix regex.
  const iso = "2026-09-14T00:00:00.000Z";
  const ground = new Date(iso);
  assert.deepEqual(eventDateParts(iso), {
    year: ground.getFullYear(),
    month: ground.getMonth() + 1,
    day: ground.getDate(),
  });
});

test("eventDateParts: missing or unparseable input returns null", () => {
  assert.equal(eventDateParts(undefined), null);
  assert.equal(eventDateParts("not a date"), null);
});

test("formatDateRange: a single day with no end date", () => {
  assert.equal(formatDateRange("2026-01-01"), "Jan 1, 2026");
});

test("formatDateRange: start and end on the same resolved day collapse to one date", () => {
  assert.equal(formatDateRange("2026-01-01", "2026-01-01"), "Jan 1, 2026");
});

test("formatDateRange: a real multi-day range", () => {
  assert.equal(formatDateRange("2026-01-01", "2026-01-03"), "Jan 1, 2026 – Jan 3, 2026");
});

test("formatDateRange: no start date at all returns undefined", () => {
  assert.equal(formatDateRange(undefined, "2026-01-01"), undefined);
});
