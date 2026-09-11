import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { BoardPairing } from "../../lib/bcp.ts";

// Same rationale as myPairings.test.ts for why boards/ITC-ranking fetches
// are mocked but never actually exercised: they only fire on a click this
// static SSR pass can't simulate (see app/lib/testUtils.ts / CLAUDE.md).
// buildBcpItcProfileUrl has to be included too — RoundBoard renders
// ItcBadge, which imports it from this same mocked module.
mock.module("../../lib/bcp.ts", {
  namedExports: {
    fetchItcRanking: async () => null,
    fetchTeamPairingBoards: async () => [],
    buildBcpItcProfileUrl: (id: string, league?: string) =>
      `https://www.bestcoastpairings.com/user/${id}${league ? `?league=${league}` : ""}`,
  },
});
const { default: RoundBoard } = await import("./roundBoard.tsx");

const baseProps = {
  eventId: "e1",
  round: 2,
  minRound: 1,
  maxRound: 5,
  entries: [] as BoardPairing[],
  loading: false,
  error: null,
  onRoundChange: () => {},
  onRefresh: () => {},
  teamEvent: false,
};

test("shows an error and nothing else", () => {
  const html = renderToStaticMarkup(React.createElement(RoundBoard, { ...baseProps, error: "bad" }));
  assert.match(html, /Couldn&#x27;t load round 2: bad/);
});

test("shows a loading message", () => {
  const html = renderToStaticMarkup(React.createElement(RoundBoard, { ...baseProps, loading: true }));
  assert.match(html, /Loading round 2…/);
});

test("shows the default or a custom empty message", () => {
  const defaultHtml = renderToStaticMarkup(React.createElement(RoundBoard, baseProps));
  assert.match(defaultHtml, /No pairings published yet for round 2\./);

  const customHtml = renderToStaticMarkup(
    React.createElement(RoundBoard, { ...baseProps, emptyMessage: "No matches." })
  );
  assert.match(customHtml, /No matches\./);
});

test("disables the prev/next round buttons at the min/max bounds", () => {
  // Matches the whole opening <button> tag carrying the aria-label, then
  // checks for `disabled` anywhere inside it — not a fixed attribute
  // order, which is an implementation detail of the shared Button
  // primitive (ui/button.tsx) these buttons are built on, not a
  // behavior this test should pin down.
  const atMin = renderToStaticMarkup(React.createElement(RoundBoard, { ...baseProps, round: 1 }));
  const prevButton = atMin.match(/<button[^>]*aria-label="Previous round"[^>]*>/)?.[0] ?? "";
  assert.match(prevButton, /disabled/);

  const atMax = renderToStaticMarkup(React.createElement(RoundBoard, { ...baseProps, round: 5 }));
  const nextButton = atMax.match(/<button[^>]*aria-label="Next round"[^>]*>/)?.[0] ?? "";
  assert.match(nextButton, /disabled/);
});

// Just the enabled/disabled state, via SSR — RoundBoard uses hooks
// (useState/useDelayedFlag), so unlike PlayerCard's direct-call tests it
// can't be invoked as a plain function to grab onClick and simulate a
// real click; see app/lib/testUtils.ts's documented limitation.
test("the refresh button is enabled while idle and disabled while loading", () => {
  // Matches the literal `disabled=""` HTML attribute React SSR emits for
  // a true boolean prop — not just the substring "disabled", which the
  // button's own className (Button's disabled:opacity-50 etc.) always
  // contains regardless of actual state.
  const idle = renderToStaticMarkup(React.createElement(RoundBoard, baseProps));
  const idleButton = idle.match(/<button[^>]*aria-label="Check for updated pairings"[^>]*>/)?.[0] ?? "";
  assert.ok(!/\sdisabled=""/.test(idleButton));

  const loading = renderToStaticMarkup(React.createElement(RoundBoard, { ...baseProps, loading: true }));
  const loadingButton =
    loading.match(/<button[^>]*aria-label="Check for updated pairings"[^>]*>/)?.[0] ?? "";
  assert.match(loadingButton, /\sdisabled=""/);
});

test("lists every pairing, highlighting followed ones and showing scores", () => {
  const entries: BoardPairing[] = [
    {
      id: "b1",
      table: 1,
      side1Id: "s1",
      side1Name: "Alice",
      side2Id: "s2",
      side2Name: "Bob",
      published: true,
      isDone: true,
      isBye: false,
      side1Score: 70,
      side2Score: 30,
    },
    {
      id: "b2",
      side1Name: "Carol",
      side2Name: "Bye",
      published: false,
      isDone: false,
      isBye: true,
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(RoundBoard, { ...baseProps, entries, followedIds: new Set(["s1"]) })
  );
  assert.match(html, /Alice/);
  assert.match(html, /Bob/);
  assert.match(html, /70–30/);
  assert.match(html, /unpublished/);
  const rows = html.split("<li").slice(1);
  const aliceRow = rows.find((r) => r.includes("Alice"));
  assert.ok(aliceRow?.includes("border-brass-500/40"));
});
