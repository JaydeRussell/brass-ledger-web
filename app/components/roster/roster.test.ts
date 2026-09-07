import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TeamRoster from "./roster.tsx";
import { find } from "../../lib/testUtils.ts";

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

test("shows a placeholder message when the team has no players yet", () => {
  const html = renderToStaticMarkup(React.createElement(TeamRoster, { teamName: "Empty", players: [] }));
  assert.match(html, /No players with a submitted list found/);
});

test("the Follow button only appears when onTrack is given, and calls it on click", () => {
  const noButton = TeamRoster({ teamName: "Team A", players });
  assert.equal(find(noButton, (el) => el.type === "button"), undefined);

  const calls: number[] = [];
  const withButton = TeamRoster({ teamName: "Team A", players, onTrack: () => calls.push(1) });
  const followBtn = find(withButton, (el) => el.type === "button");
  assert.equal(followBtn?.props.children, "Follow");
  followBtn!.props.onClick();
  assert.deepEqual(calls, [1]);
});
