import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import Card from "./card.tsx";

test("renders the surface-1/border/radius-lg shell around its children", () => {
  const html = renderStatic(React.createElement(Card, null, "content"));
  assert.match(html, /bg-surface-1/);
  assert.match(html, /rounded-lg/);
  assert.match(html, />content</);
});

test("merges a caller's className rather than replacing the base classes", () => {
  const html = renderStatic(React.createElement(Card, { className: "p-4" }, "x"));
  assert.match(html, /bg-surface-1/);
  assert.match(html, /p-4/);
});
