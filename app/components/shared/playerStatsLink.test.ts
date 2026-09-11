import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PlayerStatsLink from "./playerStatsLink.tsx";

test("renders plain text (not a link) when there's no bcpUserId", () => {
  const html = renderToStaticMarkup(React.createElement(PlayerStatsLink, { name: "Jayde Russell" }));
  assert.equal(html, "Jayde Russell");
});

test("links to /players/[bcpUserId] with the name carried as a one-shot ?name= hint", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerStatsLink, { name: "Jayde Russell", bcpUserId: "bcp-1" })
  );
  assert.match(html, /<a /);
  assert.match(html, /href="\/players\/bcp-1\?name=Jayde%20Russell"/);
  assert.match(html, />Jayde Russell</);
});

test("URL-encodes special characters in both the bcpUserId and the name", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerStatsLink, { name: "A & B", bcpUserId: "id/with slash" })
  );
  assert.match(
    html,
    new RegExp(
      `href="/players/${encodeURIComponent("id/with slash")}\\?name=${encodeURIComponent("A & B")}"`
    )
  );
});
