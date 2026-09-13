import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import TeamRosterList from "./teamRosterList.tsx";

test("lists each player under the team's name", () => {
  const html = renderStatic(
    React.createElement(TeamRosterList, {
      name: "Master Crafted",
      players: [
        { id: "p1", name: "Jayde Russell", faction: "World Eaters", bcpUserId: "u1" },
        { id: "p2", name: "Andy Shellenbarger", faction: "Necrons", bcpUserId: "u2" },
      ],
    })
  );
  assert.match(html, /Master Crafted/);
  assert.match(html, /Jayde Russell/);
  assert.match(html, /Andy Shellenbarger/);
});

test("shows name+disposition on one row and faction+ITC badge on the next", () => {
  const html = renderStatic(
    React.createElement(TeamRosterList, {
      name: "Master Crafted",
      players: [
        {
          id: "p1",
          name: "Jayde Russell",
          faction: "World Eaters",
          disposition: "Purge the Foe",
          bcpUserId: "u1",
        },
      ],
      itcByUserId: { u1: { points: 1465.4, placing: 15 } },
      itcLeagueId: "league-2026",
    })
  );
  assert.match(html, /Jayde Russell[\s\S]*>Purge</);
  assert.match(html, /World Eaters/);
  assert.match(html, /<span class="sm:hidden">#15<\/span>/);
});

test("links a player's name to their BCP list when one's published", () => {
  const html = renderStatic(
    React.createElement(TeamRosterList, {
      name: "Master Crafted",
      players: [
        {
          id: "p1",
          name: "Jayde Russell",
          faction: "World Eaters",
          bcpUserId: "u1",
          list: "https://example.com/lists/u1",
        },
      ],
    })
  );
  assert.match(html, /<a href="https:\/\/example\.com\/lists\/u1"[^>]*>Jayde Russell<\/a>/);
  assert.ok(!html.includes("/players/u1"));
});

test("falls back to the player stats link when no list is published", () => {
  const html = renderStatic(
    React.createElement(TeamRosterList, {
      name: "Master Crafted",
      players: [{ id: "p1", name: "Jayde Russell", faction: "World Eaters", bcpUserId: "u1" }],
    })
  );
  assert.match(html, /href="\/players\/u1\?name=Jayde(%20|\+)Russell"/);
});

test("renders an empty list without error when the roster is empty", () => {
  const html = renderStatic(React.createElement(TeamRosterList, { name: "Empty Team", players: [] }));
  assert.match(html, /Empty Team/);
});
