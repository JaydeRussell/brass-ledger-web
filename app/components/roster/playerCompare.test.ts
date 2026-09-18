import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PlayerCompare from "./playerCompare.tsx";
import { find, findAll } from "../../lib/testUtils.ts";

const players: Player[] = [
  { id: "p1", name: "Alice Anderson", faction: "Space Marines" },
  { id: "p2", name: "Bob Brown", faction: "Necrons", subFaction: "Novokh" },
  { id: "p3", name: "Cara Chen", faction: "Aeldari" },
];

// Same "no hooks in PlayerCompare itself, TeamCompare's own testing
// approach carries over unchanged" reasoning as teamCompare.test.ts.

test("shows an empty player picker for each side when nothing is selected yet", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerCompare, {
      players,
      selectedA: null,
      selectedB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    })
  );
  assert.match(html, />Player A</);
  assert.match(html, />Player B</);
  assert.equal((html.match(/Find a player…/g) ?? []).length, 2);
  assert.match(html, /Alice Anderson/);
  assert.match(html, /Bob Brown/);
});

test("shows the picked player's card and a Change player control, leaving the other side's picker up", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerCompare, {
      players,
      selectedA: "p1",
      selectedB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    })
  );
  assert.match(html, /Alice Anderson/);
  assert.match(html, /Change player/);
  assert.equal((html.match(/Find a player…/g) ?? []).length, 1);
});

test("shows both cards side by side once both players are picked, with no picker left", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerCompare, {
      players,
      selectedA: "p1",
      selectedB: "p2",
      onSelectA: () => {},
      onSelectB: () => {},
    })
  );
  assert.match(html, /Alice Anderson/);
  assert.match(html, /Bob Brown/);
  assert.ok(!html.includes("Find a player…"));
});

test("Change player calls only that side's onSelect, with null", () => {
  const callsA: (string | null)[] = [];
  const callsB: (string | null)[] = [];
  const tree = PlayerCompare({
    players,
    selectedA: "p1",
    selectedB: "p2",
    onSelectA: (id) => callsA.push(id),
    onSelectB: (id) => callsB.push(id),
  });
  const buttons = findAll(tree, (el) => el.type === "button");
  assert.equal(buttons.length, 2);
  buttons[0].props.onClick();
  assert.deepEqual(callsA, [null]);
  assert.deepEqual(callsB, []);
});

test("a side's picker excludes whichever player the other side already picked", () => {
  const tree = PlayerCompare({
    players,
    selectedA: null,
    selectedB: "p2",
    onSelectA: () => {},
    onSelectB: () => {},
  });
  const picker = find(tree, (el) => (el.props as { players?: Player[] }).players !== undefined);
  assert.ok(picker, "expected to find Player A's still-rendered picker");
  assert.deepEqual(
    (picker!.props.players as Player[]).map((p) => p.id),
    ["p1", "p3"]
  );
});
