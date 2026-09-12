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

test("renders an empty list without error when the roster is empty", () => {
  const html = renderStatic(React.createElement(TeamRosterList, { name: "Empty Team", players: [] }));
  assert.match(html, /Empty Team/);
});
