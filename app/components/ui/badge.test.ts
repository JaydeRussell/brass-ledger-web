import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import Badge from "./badge.tsx";

test("defaults to the neutral tone", () => {
  const html = renderStatic(React.createElement(Badge, null, "Draft"));
  assert.match(html, /bg-surface-2/);
  assert.match(html, />Draft</);
});

test("each tone maps to its own token-backed classes", () => {
  const brass = renderStatic(React.createElement(Badge, { tone: "brass" }, "Featured"));
  const danger = renderStatic(React.createElement(Badge, { tone: "danger" }, "Rejected"));
  const success = renderStatic(React.createElement(Badge, { tone: "success" }, "Approved"));
  const warning = renderStatic(React.createElement(Badge, { tone: "warning" }, "Pending"));
  assert.match(brass, /bg-brass-500\/15/);
  assert.match(danger, /bg-danger-500\/15/);
  assert.match(success, /bg-success-500\/15/);
  assert.match(warning, /bg-warning-500\/15/);
});
