import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import PlayerFactionDetails from "./playerFactionDetails.tsx";

const players: Player[] = [
  {
    id: "p1",
    name: "Rival",
    faction: "Necrons",
    disposition: "Purge the Foe",
    list: "https://example.com/list.pdf",
    bcpUserId: "u-rival",
  },
];

test("renders nothing without a matching bcpUserId in the roster", () => {
  assert.equal(renderStatic(React.createElement(PlayerFactionDetails, { players })), "");
  assert.equal(
    renderStatic(React.createElement(PlayerFactionDetails, { bcpUserId: "u-unknown", players })),
    ""
  );
});

test("shows faction, disposition, and a list link when the roster has them", () => {
  const html = renderStatic(React.createElement(PlayerFactionDetails, { bcpUserId: "u-rival", players }));
  assert.match(html, /\(Necrons\)/);
  assert.match(html, /Purge the Foe/);
  assert.match(html, /href="https:\/\/example\.com\/list\.pdf"/);
});
