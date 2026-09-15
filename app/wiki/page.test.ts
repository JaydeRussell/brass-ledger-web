import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WikiPage from "./page.tsx";
import { NavProvider } from "../components/nav/navContext.tsx";
import { DISPOSITIONS } from "../lib/dispositions.ts";
import { MISSION_MATRIX } from "../lib/missionMatrix.ts";
import { SPECIAL_ACTION_DEFINITIONS } from "../lib/missionActionGlossary.ts";
import { MISSION_NAMES } from "../lib/missions.ts";

// A plain server component (no hooks, no "use client" — same as
// about/page.tsx and changelog/page.tsx), so a static SSR pass shows its
// real, final output. PageHeader's HamburgerButton needs a NavProvider
// ancestor, same as every other page test.
function render() {
  return renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(WikiPage)));
}

// React's SSR text-node escaping (&, <, >, ", ') — same helper as
// changelog/page.test.ts, needed here for mission names with apostrophes
// (e.g. "Destroyer's Wrath") and glossary definitions containing them.
function escapeForRenderedText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

test("lists all 5 Force Dispositions", () => {
  const html = render();
  for (const disposition of DISPOSITIONS) {
    assert.ok(html.includes(disposition), `expected "${disposition}" in output`);
  }
});

test("renders the full 5x5 disposition matchup matrix", () => {
  const html = render();
  for (const mine of DISPOSITIONS) {
    for (const opponent of DISPOSITIONS) {
      const mission = MISSION_MATRIX[mine][opponent];
      assert.ok(
        html.includes(escapeForRenderedText(mission)),
        `expected mission "${mission}" (${mine} vs ${opponent}) in output`
      );
    }
  }
});

test("every one of the 25 missions appears (once per disposition-group listing)", () => {
  const html = render();
  for (const mission of MISSION_NAMES) {
    assert.ok(html.includes(escapeForRenderedText(mission)), `expected mission "${mission}" in output`);
  }
});

test("renders every special-action glossary term and its definition", () => {
  const html = render();
  for (const [term, definition] of Object.entries(SPECIAL_ACTION_DEFINITIONS)) {
    assert.ok(html.toLowerCase().includes(term.toLowerCase()), `expected term "${term}" in output`);
    assert.ok(
      html.includes(escapeForRenderedText(definition)),
      `expected definition for "${term}" in output`
    );
  }
});

test("shows the source attribution footnote", () => {
  const html = render();
  assert.match(html, /Warhammer Event Companion v1\.2/);
  assert.match(html, /Wahapedia/);
});
