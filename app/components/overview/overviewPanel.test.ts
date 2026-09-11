import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OverviewPanel from "./overviewPanel.tsx";
import type { EventInfo, MyPairing } from "../../lib/bcp.ts";

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
  const html = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: null,
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(html, /Loading event/);
});

test("shows the event's status line for each phase", () => {
  const notStarted = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: { ...baseEvent, started: false },
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(notStarted, /Hasn&#x27;t started yet/);

  const inProgress = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: baseEvent,
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(inProgress, /Round 2 of 5 — in progress/);

  const ended = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: { ...baseEvent, ended: true, numberOfRounds: 5 },
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(ended, /Ended — 5 rounds/);
});

test("shows a 'not following anyone' prompt when nobody is followed", () => {
  const html = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: baseEvent,
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(html, /Not following anyone/);
  assert.match(html, /Go to Roster/);
});

test("shows each followed entry's most recent published pairing", () => {
  const pairings: MyPairing[] = [
    { round: 1, published: true, isDone: true, opponentName: "Team X" },
    { round: 2, published: false, isDone: false, opponentName: "Team Y" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: baseEvent,
      following: [{ label: "My Team", pairings }],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(html, /Following My Team/);
  // Round 2 isn't published, so the latest *published* one (round 1) wins.
  assert.match(html, /Round 1: vs Team X/);
});

test("shows a fallback when a followed entry has no published pairings", () => {
  const html = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: baseEvent,
      following: [{ label: "My Team", pairings: [] }],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(html, /No pairings published yet\./);
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
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(withFacts, /Denver, CO/);
  assert.match(withFacts, />Jayde</);

  const withoutFacts = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: baseEvent,
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.ok(!withoutFacts.includes("Location"));
  assert.ok(!withoutFacts.includes("Organizer"));
});

test("renders a 'Your round' card first when myRound is supplied", () => {
  const html = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: baseEvent,
      myRound: {
        round: 2,
        loading: false,
        error: null,
        pairing: { round: 2, table: 7, published: true, isDone: false, opponentName: "Rival" },
        board: null,
        players: [],
      },
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.match(html, /Your round/);
  assert.match(html, /Table 7/);
});

test("omits the 'Your round' card when myRound is absent", () => {
  const html = renderToStaticMarkup(
    React.createElement(OverviewPanel, {
      eventInfo: baseEvent,
      following: [],
      onGoToRoster: () => {},
      onGoToPairings: () => {},
    })
  );
  assert.ok(!html.includes("Your round"));
});
