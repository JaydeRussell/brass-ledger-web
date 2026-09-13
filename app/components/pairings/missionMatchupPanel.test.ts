import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MissionMatchupPanel from "./missionMatchupPanel.tsx";

test("shows both sides' missions, summary, tactics, and rules for a known pairing", () => {
  const html = renderToStaticMarkup(
    React.createElement(MissionMatchupPanel, {
      myDisposition: "Purge the Foe",
      opponentDisposition: "Take and Hold",
    })
  );
  assert.match(html, /Unstoppable Force/);
  assert.match(html, /Immovable Object/);
  assert.match(html, /How to play it out/);
  // The full-rules disclosure is collapsed (a native <details>), but its
  // content is still present in the static markup either way.
  assert.match(html, /You control one or more central objectives/);
});

test("renders all three deployment-layout images, order-independent of argument order", () => {
  const forward = renderToStaticMarkup(
    React.createElement(MissionMatchupPanel, {
      myDisposition: "Disruption",
      opponentDisposition: "Priority Assets",
    })
  );
  const backward = renderToStaticMarkup(
    React.createElement(MissionMatchupPanel, {
      myDisposition: "Priority Assets",
      opponentDisposition: "Disruption",
    })
  );
  for (const html of [forward, backward]) {
    assert.match(html, /disruption-vs-priority-assets\/a\.webp/);
    assert.match(html, /disruption-vs-priority-assets\/b\.webp/);
    assert.match(html, /disruption-vs-priority-assets\/c\.webp/);
    assert.match(html, /Layout A/);
    assert.match(html, /Layout B/);
    assert.match(html, /Layout C/);
  }
});

test("a mirror matchup shows the same mission for both sides", () => {
  const html = renderToStaticMarkup(
    React.createElement(MissionMatchupPanel, {
      myDisposition: "Reconnaissance",
      opponentDisposition: "Reconnaissance",
    })
  );
  assert.match(html, /Your mission: <\/span><span class="[^"]*">Gather Intel/);
  assert.match(html, /Their mission: <\/span><span class="[^"]*">Gather Intel/);
});

test("shows the source version/date footnote", () => {
  const html = renderToStaticMarkup(
    React.createElement(MissionMatchupPanel, {
      myDisposition: "Take and Hold",
      opponentDisposition: "Take and Hold",
    })
  );
  assert.match(html, /Warhammer Event Companion v1\.2/);
});
