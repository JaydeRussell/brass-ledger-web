import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ItcBadge from "./itcBadge.tsx";

// ItcBadge calls hooks (useState/useEffect for the viewer's dark-mode
// preference), so it's tested via real SSR rather than direct-call — see
// app/lib/testUtils.ts. Effects don't run under SSR, so every case below
// exercises the (correct, matches-the-server) light-mode default.

test("renders nothing while a ranking hasn't resolved yet or is null", () => {
  assert.equal(renderToStaticMarkup(React.createElement(ItcBadge, { ranking: undefined, title: "t" })), "");
  assert.equal(renderToStaticMarkup(React.createElement(ItcBadge, { ranking: null, title: "t" })), "");
});

test("renders a plain span (not a link) when there's no bcpUserId", () => {
  const html = renderToStaticMarkup(
    React.createElement(ItcBadge, { ranking: { points: 1234.6, placing: 7 }, title: "t" })
  );
  assert.match(html, /<span/);
  assert.ok(!html.includes("<a "));
  assert.match(html, /#7/);
  assert.match(html, /1235 pts/); // rounded
});

test("shows '?' for placing when the ranking has none", () => {
  const html = renderToStaticMarkup(
    React.createElement(ItcBadge, { ranking: { points: 10 }, title: "t" })
  );
  assert.match(html, /#\?/);
});

test("renders a link to the BCP profile when bcpUserId is given, scoped to the league", () => {
  const html = renderToStaticMarkup(
    React.createElement(ItcBadge, {
      ranking: { points: 500, placing: 3 },
      bcpUserId: "u1",
      leagueId: "league-2026",
      title: "View X's history",
    })
  );
  assert.match(html, /<a /);
  assert.match(html, /href="[^"]*\/user\/u1\?league=league-2026"/);
  assert.match(html, /title="View X&#x27;s history"/);
});

test("carries both a placing-only compact label and the full label, toggled responsively (roadmap #8)", () => {
  const html = renderToStaticMarkup(
    React.createElement(ItcBadge, { ranking: { points: 1465.4, placing: 15 }, title: "t" })
  );
  assert.match(html, /<span class="sm:hidden">#15<\/span>/);
  assert.match(html, /<span class="hidden sm:inline">#15 · 1465 pts<\/span>/);
});

test("size=\"xs\" uses the tighter text size class", () => {
  const html = renderToStaticMarkup(
    React.createElement(ItcBadge, { ranking: { points: 10 }, title: "t", size: "xs" })
  );
  assert.match(html, /text-\[11px\]/);
});
