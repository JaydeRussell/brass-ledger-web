import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TeamRoster from "./roster.tsx";

const players: Player[] = [
  { id: "p1", name: "Alice Anderson", faction: "Space Marines" },
  { id: "p2", name: "Bob Brown", faction: "Necrons", subFaction: "Novokh" },
];

test("shows the team name and a correctly pluralized player count", () => {
  const html = renderToStaticMarkup(React.createElement(TeamRoster, { teamName: "Team A", players }));
  assert.match(html, /Team A/);
  assert.match(html, /2 players/);

  const oneHtml = renderToStaticMarkup(
    React.createElement(TeamRoster, { teamName: "Solo", players: [players[0]] })
  );
  assert.match(oneHtml, /1 player</);
});

test("lists every player with their faction", () => {
  const html = renderToStaticMarkup(React.createElement(TeamRoster, { teamName: "Team A", players }));
  assert.match(html, /Alice Anderson/);
  assert.match(html, /Bob Brown/);
  assert.match(html, /Necrons — Novokh/);
});

test("shows a disposition badge only for players who have one", () => {
  const withDisposition: Player[] = [
    ...players,
    { id: "p3", name: "Cara Chen", faction: "Aeldari", disposition: "Reconnaissance" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(TeamRoster, { teamName: "Team A", players: withDisposition })
  );
  assert.match(html, /Recon/);
});

test("doesn't repeat the disposition as a subfaction suffix when BCP reused that field for it", () => {
  const withDisposition: Player[] = [
    { id: "p3", name: "Cara Chen", faction: "Aeldari", subFaction: "Reconnaissance", disposition: "Reconnaissance" },
  ];
  const html = renderToStaticMarkup(
    React.createElement(TeamRoster, { teamName: "Team A", players: withDisposition })
  );
  assert.ok(!html.includes("Aeldari — Reconnaissance"));
  // The faction line carries no suffix; the disposition only appears in
  // its badge.
  assert.ok(!/Aeldari\s*—/.test(html));
});

test("shows a placeholder message when the team has no players yet", () => {
  const html = renderToStaticMarkup(React.createElement(TeamRoster, { teamName: "Empty", players: [] }));
  assert.match(html, /No players with a submitted list found/);
});
