import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import TeamItcComparison from "./teamItcComparison.tsx";
import type { ItcRanking } from "../../lib/bcp.ts";

const itcByUserId: Record<string, ItcRanking | null> = {
  "u-a1": { points: 1500 },
  "u-a2": { points: 1580 },
  "u-b1": { points: 1400 },
  "u-b2": { points: 1420 },
};

test("shows each side's average ITC, neutrally, with no framing", () => {
  const html = renderStatic(
    React.createElement(TeamItcComparison, {
      side1Name: "Master Crafted",
      side1Players: [
        { id: "p1", name: "A1", faction: "Orks", bcpUserId: "u-a1" },
        { id: "p2", name: "A2", faction: "Orks", bcpUserId: "u-a2" },
      ],
      side2Name: "Rose City Ruffians",
      side2Players: [
        { id: "p3", name: "B1", faction: "Necrons", bcpUserId: "u-b1" },
        { id: "p4", name: "B2", faction: "Necrons", bcpUserId: "u-b2" },
      ],
      itcByUserId,
    })
  );
  assert.match(html, /Master Crafted: Avg ITC 1540/);
  assert.match(html, /Rose City Ruffians: Avg ITC 1410/);
  // No "favored"/"underdog" framing or color-coded winner class.
  assert.ok(!html.includes("favored"));
  assert.ok(!html.includes("underdog"));
});

test("renders nothing when neither side has any ITC data yet", () => {
  const html = renderStatic(
    React.createElement(TeamItcComparison, {
      side1Name: "Team A",
      side1Players: [{ id: "p1", name: "A1", faction: "Orks" }],
      side2Name: "Team B",
      side2Players: [{ id: "p2", name: "B1", faction: "Necrons" }],
      itcByUserId: {},
    })
  );
  assert.equal(html, "");
});

test("shows a placeholder for whichever side has no ITC data yet, not a false zero", () => {
  const html = renderStatic(
    React.createElement(TeamItcComparison, {
      side1Name: "Team A",
      side1Players: [{ id: "p1", name: "A1", faction: "Orks", bcpUserId: "u-a1" }],
      side2Name: "Team B",
      side2Players: [{ id: "p2", name: "B1", faction: "Necrons" }],
      itcByUserId,
    })
  );
  assert.match(html, /Team A: Avg ITC 1500/);
  assert.match(html, /Team B: Avg ITC —/);
});
