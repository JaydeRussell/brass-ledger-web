import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MyEvent } from "../../lib/myEvents.ts";

const { default: MonthGrid } = await import("./monthGrid.tsx");

function render(events: MyEvent[]): string {
  return renderToStaticMarkup(React.createElement(MonthGrid, { events }));
}

// "YYYY-MM-DD" for the given day-of-month within the currently displayed
// month (the grid defaults to today's month/year) — anchored to a fixed
// mid-month day (10th–12th) rather than an offset from "today" itself,
// so a multi-day range never accidentally spills into next month
// depending on what day of the month the test happens to run on.
function isoDayThisMonth(day: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), day);
  return d.toISOString().slice(0, 10);
}

// A month far enough away that it's never the currently displayed one,
// regardless of what day these tests run on.
function isoDateNextYear(): string {
  const now = new Date();
  return new Date(now.getFullYear() + 1, now.getMonth(), 1).toISOString().slice(0, 10);
}

test("renders the weekday header row and the current month's label", () => {
  const html = render([]);
  for (const label of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
    assert.match(html, new RegExp(`>${label}<`));
  }
  const expectedLabel = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
  assert.ok(html.includes(expectedLabel), `expected month label ${expectedLabel} in output`);
});

test("labels a day within the current month with the event's name when it covers it", () => {
  const events: MyEvent[] = [{ eventId: "e1", eventName: "Mid-month Event", startDate: isoDayThisMonth(10) }];
  const html = render(events);
  assert.match(html, />Mid-month Event</);
});

test("labels every day within a multi-day event's inclusive range", () => {
  const events: MyEvent[] = [
    { eventId: "e1", eventName: "Multi-day GT", startDate: isoDayThisMonth(10), endDate: isoDayThisMonth(12) },
  ];
  const html = render(events);
  const labelCount = (html.match(/>Multi-day GT</g) ?? []).length;
  assert.equal(labelCount, 3, `expected the name on exactly 3 days for a 3-day event, got ${labelCount}`);
});

test("a second event on the same day collapses to a '+N more' line instead of stacking names", () => {
  const day = isoDayThisMonth(10);
  const events: MyEvent[] = [
    { eventId: "e1", eventName: "First Event", startDate: day },
    { eventId: "e2", eventName: "Second Event", startDate: day },
  ];
  const html = render(events);
  assert.match(html, />First Event</);
  assert.ok(!html.includes(">Second Event<"), "expected the second same-day event not to render its own tag");
  assert.match(html, /\+1 more/);
  assert.match(html, /title="Second Event"/);
});

test("does not label any day for an event outside the displayed (current) month", () => {
  const events: MyEvent[] = [{ eventId: "e1", eventName: "Next Year's Event", startDate: isoDateNextYear() }];
  const html = render(events);
  assert.ok(!html.includes("Next Year's Event"), "expected no label for an event outside the current month");
});

test("an event with no start date is simply not labeled, not an error", () => {
  const events: MyEvent[] = [{ eventId: "e1", eventName: "No Date" }];
  const html = render(events); // should not throw
  assert.ok(!html.includes("No Date"));
});
