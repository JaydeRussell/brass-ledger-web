import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OverviewPanel from "./overviewPanel.tsx";
import type { EventInfo } from "../../lib/bcp.ts";

const baseEvent: EventInfo = {
  id: "e1",
  name: "The Challengers Cup 2026",
  teamEvent: true,
  started: true,
  ended: false,
  currentRound: 2,
  numberOfRounds: 5,
};

test("shows a loading message when there's no event info yet", () => {
  const html = renderToStaticMarkup(React.createElement(OverviewPanel, { eventInfo: null }));
  assert.match(html, /Loading event/);
});

test("shows the event's status line for each phase", () => {
  const notStarted = renderToStaticMarkup(
    React.createElement(OverviewPanel, { eventInfo: { ...baseEvent, started: false } })
  );
  assert.match(notStarted, /Hasn&#x27;t started yet/);

  const inProgress = renderToStaticMarkup(React.createElement(OverviewPanel, { eventInfo: baseEvent }));
  assert.match(inProgress, /Round 2 of 5 — in progress/);

  const ended = renderToStaticMarkup(
    React.createElement(OverviewPanel, { eventInfo: { ...baseEvent, ended: true, numberOfRounds: 5 } })
  );
  assert.match(ended, /Ended — 5 rounds/);
});

test("shows event facts (dates, location, organizer) only when present", () => {
  const withFacts = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: {
        ...baseEvent,
        startDate: "2026-03-01",
        endDate: "2026-03-02",
        location: "Denver, CO",
        organizer: "Jayde",
      },
    })
  );
  assert.match(withFacts, /Denver, CO/);
  assert.match(withFacts, />Jayde</);

  const withoutFacts = renderToStaticMarkup(React.createElement(OverviewPanel, { eventInfo: baseEvent }));
  assert.ok(!withoutFacts.includes("Location"));
  assert.ok(!withoutFacts.includes("Organizer"));
});
