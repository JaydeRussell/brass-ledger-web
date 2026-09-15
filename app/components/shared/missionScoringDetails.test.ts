import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MissionScoringDetails from "./missionScoringDetails.tsx";

test("renders every band and condition for a mission with no special terms", () => {
  const html = renderToStaticMarkup(React.createElement(MissionScoringDetails, { missionId: "Battlefield Dominance" }));
  assert.match(html, /You control more objectives than your opponent/);
  assert.match(html, /For each objective you control/);
  assert.match(html, />2VP</);
  assert.match(html, />3VP</);
});

test("renders setup text when present", () => {
  const html = renderToStaticMarkup(React.createElement(MissionScoringDetails, { missionId: "Consecrate" }));
  assert.match(html, /becomes a consecration unit/);
});

test("renders a special-action definition for a mission that cites one", () => {
  const html = renderToStaticMarkup(React.createElement(MissionScoringDetails, { missionId: "Death Trap" }));
  assert.match(html, /Booby Trap objective action/);
});

test("does not throw on a mission with two bands sharing the same 'when' text", () => {
  // Death Trap and Reconnaissance Sweep each have two separate bands both
  // labelled "Any Battle Round — end of your turn" — a past duplicate-key
  // hazard if bands were ever keyed on `when` text alone.
  assert.doesNotThrow(() => {
    renderToStaticMarkup(React.createElement(MissionScoringDetails, { missionId: "Death Trap" }));
    renderToStaticMarkup(React.createElement(MissionScoringDetails, { missionId: "Reconnaissance Sweep" }));
  });
});
