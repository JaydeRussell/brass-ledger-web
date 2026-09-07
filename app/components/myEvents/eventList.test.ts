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

// Each card starts collapsed (see eventList.tsx's EventCard doc comment)
// — the expanded overview/"View event page" link only appear after a
// click, which this SSR-only render can't simulate (no DOM to dispatch
// events into — see app/lib/testUtils.ts's note on this environment's
// testing limitations), so this only checks the collapsed starting
// state doesn't leak the expanded content.
test("starts collapsed: no expanded overview or event-page link until clicked", () => {
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
  assert.ok(!html.includes("View event page"));
  assert.ok(!html.includes("/?event=e1"));
  assert.match(html, /aria-expanded="false"/);
});
