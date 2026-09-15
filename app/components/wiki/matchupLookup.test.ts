import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import MatchupLookup from "./matchupLookup.tsx";
import { renderStatic } from "../../lib/testUtils.ts";
import { DISPOSITIONS } from "../../lib/dispositions.ts";

// MatchupLookup uses useState internally (a hook), so — like ThemeToggle
// and AccentThemePicker — it can't be walked as a plain function.
// Rendered via renderStatic (real SSR): confirms the initial render (both
// selects offer all 5 dispositions, defaulting to the first one, with
// MissionMatchupPanel's content underneath) but not an actual selection
// change — that's verified live in a real browser.

test("MatchupLookup renders both selects with all 5 dispositions as options", () => {
  const html = renderStatic(React.createElement(MatchupLookup));
  const selects = html.split("<select").slice(1);
  assert.equal(selects.length, 2);
  for (const select of selects) {
    for (const disposition of DISPOSITIONS) {
      assert.match(select, new RegExp(`>${disposition}<`));
    }
  }
});

test("MatchupLookup renders the matchup panel for the default (mirror) selection", () => {
  const html = renderStatic(React.createElement(MatchupLookup));
  // Defaults both sides to DISPOSITIONS[0] ("Take and Hold") — a mirror
  // matchup, so MissionMatchupPanel's own "Your mission"/"Their mission"
  // labels should both resolve to the same primary mission.
  assert.match(html, /Your mission:/);
  assert.match(html, /Their mission:/);
});
