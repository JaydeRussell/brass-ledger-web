import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { ViewerItcProvider, useViewerItcRanking } from "./viewerItc.tsx";
import { renderStatic } from "./testUtils.ts";

// useViewerItcRanking calls useCurrentUser() internally, which fetches
// /api/me in an effect — effects don't run under SSR (renderStatic, like
// any server render, never runs them; see auth.ts's own "starts at false"
// comment), so every case here exercises the pre-sign-in-check state.
// That's still worth asserting on directly: it's exactly the state every
// real page briefly renders in too, and it's what an ItcBadge falls back
// to before anything else is known.

function Consumer({ leagueId }: { leagueId?: string | null }) {
  const ranking = useViewerItcRanking(leagueId);
  return React.createElement("span", null, ranking === undefined ? "undefined" : JSON.stringify(ranking));
}

test("useViewerItcRanking returns undefined outside any ViewerItcProvider", () => {
  const html = renderStatic(React.createElement(Consumer, { leagueId: "league-2026" }));
  assert.match(html, />undefined</);
});

test("useViewerItcRanking returns undefined before the sign-in check has resolved (SSR)", () => {
  const html = renderStatic(
    React.createElement(ViewerItcProvider, null, React.createElement(Consumer, { leagueId: "league-2026" }))
  );
  assert.match(html, />undefined</);
});

test("useViewerItcRanking returns undefined when no leagueId is given", () => {
  const html = renderStatic(
    React.createElement(ViewerItcProvider, null, React.createElement(Consumer, { leagueId: null }))
  );
  assert.match(html, />undefined</);
});
