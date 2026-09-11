import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ChangelogPage from "./page.tsx";
import { CHANGELOG } from "../lib/changelog.ts";
import { NavProvider } from "../components/nav/navContext.tsx";

// A plain server component (no hooks, no "use client" — same as
// about/page.tsx), so a static SSR pass shows its real, final output —
// no documented limitation to note here, unlike this project's hooked
// components. PageHeader's HamburgerButton needs a NavProvider ancestor
// (normally supplied by app/layout.tsx), same as every other page test.
function render() {
  return renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(ChangelogPage)));
}

test("renders every release's version, date, and title", () => {
  const html = render();
  for (const release of CHANGELOG) {
    assert.match(html, new RegExp(`v${release.version.replace(/\./g, "\\.")}`));
    assert.ok(html.includes(release.date), `expected ${release.date} in output`);
    assert.ok(html.includes(release.title), `expected title ${release.title} in output`);
  }
});

// React's SSR text-node escaping (&, <, >, ", ') — matches what
// placingsTable.test.ts etc. already rely on implicitly via literal
// "&#x27;" in their own regexes; done generically here since these
// highlight strings aren't hand-picked to dodge special characters.
function escapeForRenderedText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

test("renders every highlight bullet for every release", () => {
  const html = render();
  const allHighlights = CHANGELOG.flatMap((r) => r.highlights);
  for (const highlight of allHighlights) {
    assert.ok(
      html.includes(escapeForRenderedText(highlight)),
      `expected highlight "${highlight}" in output`
    );
  }
});
