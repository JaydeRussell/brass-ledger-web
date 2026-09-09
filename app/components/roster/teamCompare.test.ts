import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TeamCompare from "./teamCompare.tsx";
import { find, findAll } from "../../lib/testUtils.ts";

const ironTalons: Player[] = [{ id: "p1", name: "Alice Anderson", faction: "Space Marines" }];
const bloodPact: Player[] = [{ id: "p2", name: "Bob Brown", faction: "Necrons", subFaction: "Novokh" }];
const teams = new Map<string, Player[]>([
  ["Iron Talons", ironTalons],
  ["Blood Pact", bloodPact],
  ["Ashen Vale", []],
]);
const teamNames = ["Iron Talons", "Blood Pact", "Ashen Vale"];

// TeamCompare itself has no hooks — all mutable state (the per-side search
// text) lives in the un-exported TeamPicker underneath it, and the
// "already picked" branch is inlined rather than its own component (see
// teamCompare.tsx's note) — so, like tabBar.test.ts/roster.test.ts, it can
// be called directly as a plain function for real interaction coverage,
// while TeamPicker's own typing/filtering behavior is out of reach without
// jsdom (same limitation documented in bcpProfileLinker.test.ts).

test("shows an empty team picker for each side when nothing is selected yet", () => {
  const html = renderToStaticMarkup(
    React.createElement(TeamCompare, {
      teamNames,
      teams,
      selectedA: null,
      selectedB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    })
  );
  assert.match(html, />Team A</);
  assert.match(html, />Team B</);
  assert.equal((html.match(/Find a team…/g) ?? []).length, 2);
  assert.match(html, /Iron Talons/);
  assert.match(html, /Blood Pact/);
});

test("shows the picked team's roster and a Change team control, leaving the other side's picker up", () => {
  const html = renderToStaticMarkup(
    React.createElement(TeamCompare, {
      teamNames,
      teams,
      selectedA: "Iron Talons",
      selectedB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    })
  );
  assert.match(html, /Alice Anderson/);
  assert.match(html, /Change team/);
  assert.equal((html.match(/Find a team…/g) ?? []).length, 1);
});

test("shows both rosters side by side once both teams are picked, with no picker left", () => {
  const html = renderToStaticMarkup(
    React.createElement(TeamCompare, {
      teamNames,
      teams,
      selectedA: "Iron Talons",
      selectedB: "Blood Pact",
      onSelectA: () => {},
      onSelectB: () => {},
    })
  );
  assert.match(html, /Alice Anderson/);
  assert.match(html, /Bob Brown/);
  assert.ok(!html.includes("Find a team…"));
});

test("Change team calls only that side's onSelect, with null", () => {
  const callsA: (string | null)[] = [];
  const callsB: (string | null)[] = [];
  const tree = TeamCompare({
    teamNames,
    teams,
    selectedA: "Iron Talons",
    selectedB: "Blood Pact",
    onSelectA: (t) => callsA.push(t),
    onSelectB: (t) => callsB.push(t),
  });
  const buttons = findAll(tree, (el) => el.type === "button");
  assert.equal(buttons.length, 2);
  buttons[0].props.onClick();
  assert.deepEqual(callsA, [null]);
  assert.deepEqual(callsB, []);
});

test("a side's picker excludes whatever team the other side already picked", () => {
  const tree = TeamCompare({
    teamNames,
    teams,
    selectedA: null,
    selectedB: "Blood Pact",
    onSelectA: () => {},
    onSelectB: () => {},
  });
  const picker = find(tree, (el) => (el.props as { teamNames?: string[] }).teamNames !== undefined);
  assert.ok(picker, "expected to find Team A's still-rendered picker");
  assert.deepEqual(picker!.props.teamNames, ["Iron Talons", "Ashen Vale"]);
});
