import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import EventList from "./eventList.tsx";
import type { MyEvent } from "../../lib/myEvents.ts";

test("shows the given empty message when there are no events", () => {
  const html = renderToStaticMarkup(
    React.createElement(EventList, { events: [], emptyMessage: "No past events found." })
  );
  assert.match(html, /No past events found\./);
});

test("renders one card per event with its date range, placing, faction, and team", () => {
  const events: MyEvent[] = [
    {
      eventId: "e1",
      eventName: "The Challengers Cup 2026",
      startDate: "2026-03-01",
      endDate: "2026-03-02",
      placing: 5,
      points: 1200,
      faction: "Aeldari",
      team: "Team Ultramarines",
    },
    { eventId: "e2", eventName: "Local RTT" },
  ];
  const html = renderToStaticMarkup(React.createElement(EventList, { events, emptyMessage: "n/a" }));
  assert.match(html, /The Challengers Cup 2026/);
  assert.match(html, /#5 · 1200 pts/);
  assert.match(html, /Aeldari/);
  assert.match(html, /Team Ultramarines/);
  assert.match(html, /Local RTT/);
});

test("omits placing detail for an event with no published placing yet", () => {
  const events: MyEvent[] = [{ eventId: "e3", eventName: "Future Event" }];
  const html = renderToStaticMarkup(React.createElement(EventList, { events, emptyMessage: "n/a" }));
  assert.ok(!html.includes("#"));
});

// isoOffset gives a real timestamp (not just a date) offset from now by
// the given number of days, so these cases work regardless of what day
// they actually run on.
function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

test("shows a 'Live now' badge for an event whose date range covers today", () => {
  const events: MyEvent[] = [
    { eventId: "e1", eventName: "Ongoing Event", startDate: isoOffset(-1), endDate: isoOffset(1) },
  ];
  const html = renderToStaticMarkup(React.createElement(EventList, { events, emptyMessage: "n/a" }));
  assert.match(html, /Live now/);
});

test("shows a 'Starts in' countdown for an event that hasn't started yet", () => {
  const events: MyEvent[] = [{ eventId: "e1", eventName: "Future Event", startDate: isoOffset(5) }];
  const html = renderToStaticMarkup(React.createElement(EventList, { events, emptyMessage: "n/a" }));
  assert.match(html, /Starts in \d+d/);
});

test("shows no countdown badge for an already-concluded event", () => {
  const events: MyEvent[] = [
    { eventId: "e1", eventName: "Past Event", startDate: isoOffset(-10), endDate: isoOffset(-9) },
  ];
  const html = renderToStaticMarkup(React.createElement(EventList, { events, emptyMessage: "n/a" }));
  assert.ok(!html.includes("Live now"));
  assert.ok(!html.includes("Starts in"));
});

// The "View event page" link sits directly on the card now — no
// click-to-expand step, since the old expanded overview only ever
// repeated the Status/Dates already visible on the collapsed line (see
// eventList.tsx's EventCard doc comment).
test("shows the event-page link directly on the card, with no expand step", () => {
  const events: MyEvent[] = [
    {
      eventId: "e1",
      eventName: "The Challengers Cup 2026",
      startDate: "2026-03-01",
      endDate: "2026-03-02",
      placing: 5,
      points: 1200,
      faction: "Aeldari",
      team: "Team Ultramarines",
    },
  ];
  const html = renderToStaticMarkup(React.createElement(EventList, { events, emptyMessage: "n/a" }));
  assert.match(html, /View event page/);
  assert.match(html, /\/\?event=e1/);
  assert.ok(!html.includes("aria-expanded"));
});
