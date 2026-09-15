import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// HeadToHead's actual check only runs on a click (fetchHeadToHead is
// never called on mount) — a plain react-dom/server static-SSR pass
// (see app/lib/testUtils.ts) can't simulate that click, so only the
// initial (idle, unclicked) render is inspectable here, same documented
// gap as feedbackWidget.test.ts's own open/closed toggle.
mock.module("../../lib/headToHead.ts", {
  namedExports: {
    fetchHeadToHead: async () => {
      throw new Error("should not be called before the button is clicked");
    },
  },
});
mock.module("../../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });

const { default: HeadToHead } = await import("./headToHead.tsx");

test("renders nothing when either bcpUserId is missing", () => {
  const withoutMine = renderToStaticMarkup(
    React.createElement(HeadToHead, { opponentBcpUserId: "them", opponentName: "Rival" })
  );
  assert.equal(withoutMine, "");

  const withoutTheirs = renderToStaticMarkup(
    React.createElement(HeadToHead, { myBcpUserId: "me", opponentName: "Rival" })
  );
  assert.equal(withoutTheirs, "");
});

test("shows the check trigger, naming the opponent, before any click", () => {
  const html = renderToStaticMarkup(
    React.createElement(HeadToHead, { myBcpUserId: "me", opponentBcpUserId: "them", opponentName: "Rival" })
  );
  assert.match(html, /Check head-to-head vs Rival/);
});
