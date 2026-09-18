import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import EmptyState from "./emptyState.tsx";
import { renderStatic } from "../../lib/testUtils.ts";

test("renders the message, with no title/icon/action when omitted", () => {
  const html = renderStatic(React.createElement(EmptyState, { message: "Nothing here yet." }));
  assert.match(html, />Nothing here yet\.</);
  assert.ok(!html.includes("<svg"));
});

test("renders a title, icon, and action when given", () => {
  const html = renderStatic(
    React.createElement(EmptyState, {
      icon: React.createElement("svg", { "data-testid": "icon" }),
      title: "Nothing on the horizon",
      message: "Check back later.",
      action: React.createElement("button", null, "Refresh"),
    })
  );
  assert.match(html, />Nothing on the horizon</);
  assert.match(html, />Check back later\.</);
  assert.match(html, /<svg/);
  assert.match(html, />Refresh</);
});
