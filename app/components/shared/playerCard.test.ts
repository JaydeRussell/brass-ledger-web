import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PlayerCard from "./playerCard.tsx";

const basePlayer: Player = { id: "p1", name: "Jayde Russell", faction: "Orks" };

test("shows the player's name and faction", () => {
  const html = renderToStaticMarkup(React.createElement(PlayerCard, { player: basePlayer }));
  assert.match(html, /Jayde Russell/);
  assert.match(html, /Orks/);
});

test("shows the home club in parentheses only when present", () => {
  const withoutClub = renderToStaticMarkup(React.createElement(PlayerCard, { player: basePlayer }));
  assert.ok(!withoutClub.includes("("));

  const withClub = renderToStaticMarkup(
    React.createElement(PlayerCard, { player: { ...basePlayer, homeClub: "Iron Halo" } })
  );
  assert.match(withClub, /\(Iron Halo\)/);
});

test("shows a subfaction suffix only when present", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerCard, { player: { ...basePlayer, subFaction: "Goffs" } })
  );
  assert.match(html, /Orks — Goffs/);
});

test("doesn't repeat the disposition as a subfaction suffix when BCP reused that field for it", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerCard, {
      player: { ...basePlayer, subFaction: "Purge the Foe", disposition: "Purge the Foe" },
    })
  );
  assert.ok(!html.includes("Orks — Purge the Foe"));
  assert.equal((html.match(/Purge the Foe/g) ?? []).length, 1);
});

test("shows a disposition badge only when present", () => {
  const noBadge = renderToStaticMarkup(React.createElement(PlayerCard, { player: basePlayer }));
  assert.ok(!noBadge.includes("Purge the Foe"));

  const withBadge = renderToStaticMarkup(
    React.createElement(PlayerCard, { player: { ...basePlayer, disposition: "Purge the Foe" } })
  );
  assert.match(withBadge, /Purge the Foe/);
});

test("the player's name links to their stats page when a bcpUserId is known but no list is published", () => {
  const noLink = renderToStaticMarkup(React.createElement(PlayerCard, { player: basePlayer }));
  assert.ok(!noLink.includes("/players/"));
  assert.match(noLink, /Jayde Russell/);

  const withLink = renderToStaticMarkup(
    React.createElement(PlayerCard, { player: { ...basePlayer, bcpUserId: "bcp-1" } })
  );
  assert.match(withLink, /href="\/players\/bcp-1\?name=Jayde%20Russell"/);
});

test("the player's name links to their published list instead, when one's available", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerCard, {
      player: { ...basePlayer, bcpUserId: "bcp-1", list: "https://example.com/list" },
    })
  );
  assert.match(html, /<a href="https:\/\/example\.com\/list"[^>]*>Jayde Russell<\/a>/);
  assert.ok(!html.includes("/players/bcp-1"));
});

test("shows the ITC badge only when a ranking is known, always after the faction", () => {
  const noBadge = renderToStaticMarkup(React.createElement(PlayerCard, { player: basePlayer }));
  assert.ok(!noBadge.includes("#"));

  const withBadge = renderToStaticMarkup(
    React.createElement(PlayerCard, { player: basePlayer, ranking: { points: 1465.4, placing: 15 } })
  );
  assert.match(withBadge, /<span class="sm:hidden">#15<\/span>/);
});
