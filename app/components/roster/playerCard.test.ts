import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PlayerCard from "./playerCard.tsx";
import { find } from "../../lib/testUtils.ts";

const basePlayer: Player = { id: "p1", name: "Jayde Russell", faction: "Orks" };

test("shows the player's name, faction, and initials", () => {
  const html = renderToStaticMarkup(React.createElement(PlayerCard, { player: basePlayer }));
  assert.match(html, /Jayde Russell/);
  assert.match(html, /Orks/);
  assert.match(html, />JR</); // initials avatar
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

test("shows a disposition badge only when present", () => {
  const noBadge = renderToStaticMarkup(React.createElement(PlayerCard, { player: basePlayer }));
  assert.ok(!noBadge.includes("Purge the Foe"));

  const withBadge = renderToStaticMarkup(
    React.createElement(PlayerCard, { player: { ...basePlayer, disposition: "Purge the Foe" } })
  );
  assert.match(withBadge, /Purge the Foe/);
});

test("doesn't repeat the disposition as a subfaction suffix when BCP reused that field for it", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerCard, {
      player: { ...basePlayer, subFaction: "Purge the Foe", disposition: "Purge the Foe" },
    })
  );
  assert.ok(!html.includes("Orks — Purge the Foe"));
  // The badge itself still renders the text once.
  assert.equal((html.match(/Purge the Foe/g) ?? []).length, 1);
});

test("shows a link to the army list only when one is published", () => {
  const noList = renderToStaticMarkup(React.createElement(PlayerCard, { player: basePlayer }));
  assert.ok(!noList.includes(">list<"));

  const withList = renderToStaticMarkup(
    React.createElement(PlayerCard, { player: { ...basePlayer, list: "https://example.com/list" } })
  );
  assert.match(withList, /href="https:\/\/example\.com\/list"/);
  assert.match(withList, />list</);
});

test("the Follow button only appears when onTrack is given, and reflects tracked state", () => {
  const noButton = PlayerCard({ player: basePlayer });
  assert.equal(find(noButton, (el) => el.type === "button"), undefined);

  const calls: number[] = [];
  const untracked = PlayerCard({ player: basePlayer, onTrack: () => calls.push(1) });
  const followBtn = find(untracked, (el) => el.type === "button");
  assert.equal(followBtn?.props.children, "Follow");
  followBtn!.props.onClick();
  assert.deepEqual(calls, [1]);

  const tracked = PlayerCard({ player: basePlayer, onTrack: () => {}, tracked: true });
  const followingBtn = find(tracked, (el) => el.type === "button");
  assert.equal(followingBtn?.props.children, "Following ✓");
});
