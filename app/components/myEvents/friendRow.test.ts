import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import type { Friend } from "../../lib/friends.ts";

// This component calls useState (events-disclosure open/closed, plus
// the removing flag), so it's tested via renderStatic (SSR) — see
// testUtils.ts's doc comment. The "Their events" click → fetch → list
// transition is a stateful change renderStatic can't simulate (no DOM,
// no effects) — verified live in a real browser instead.
mock.module("../../lib/friends.ts", {
  namedExports: {
    fetchFriendEvents: async () => {
      throw new Error("should not be called before the Their events toggle is clicked");
    },
  },
});

const { default: FriendRow } = await import("./friendRow.tsx");

function friend(overrides: Partial<Friend> = {}): Friend {
  return { userId: 1, name: "Bea Brooks", bcpUserId: "bcp-1", ...overrides };
}

test("shows the friend's name and a dossier link when a bcpUserId is known", () => {
  const html = renderStatic(React.createElement(FriendRow, { friend: friend(), onRemove: () => {} }));
  assert.match(html, /Bea Brooks/);
  assert.match(html, /href="\/dossier\/bcp-1"/);
  assert.match(html, />Their events</);
});

test("hides the dossier link and Their-events button with no bcpUserId", () => {
  const html = renderStatic(React.createElement(FriendRow, { friend: friend({ bcpUserId: "" }), onRemove: () => {} }));
  assert.ok(!html.includes("/dossier/"));
  assert.ok(!html.includes("Their events"));
});

test("always shows a Remove button", () => {
  const html = renderStatic(React.createElement(FriendRow, { friend: friend(), onRemove: () => {} }));
  assert.match(html, />Remove</);
});
