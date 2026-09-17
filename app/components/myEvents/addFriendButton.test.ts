import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";

// This component's whole visible state (whether it shows "Add Friend",
// "Friends ✓", or nothing) is decided by fetchFriends() resolving
// inside a useEffect, which never runs in a static SSR-only render (no
// DOM, no effects — see testUtils.ts's doc comment) — so every render
// here is stuck at the initial "checking" state, which deliberately
// renders nothing. The real "which label shows" and "click → Sending…
// → Request sent" behavior is verified live in a real browser instead.
mock.module("../../lib/friends.ts", {
  namedExports: {
    fetchFriends: async () => {
      throw new Error("should not be reached — renderStatic never runs effects");
    },
    sendFriendRequest: async () => {
      throw new Error("should not be reached — no click simulation in a static render");
    },
  },
});
mock.module("../../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });

const { default: AddFriendButton } = await import("./addFriendButton.tsx");

test("renders nothing before the friend-status check resolves", () => {
  const html = renderStatic(React.createElement(AddFriendButton, { bcpUserId: "bcp-1" }));
  assert.equal(html, "");
});
