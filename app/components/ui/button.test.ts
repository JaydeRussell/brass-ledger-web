import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import Button from "./button.tsx";

test("defaults to a secondary, md, type=button element", () => {
  const html = renderStatic(React.createElement(Button, null, "Click"));
  assert.match(html, /type="button"/);
  assert.match(html, /bg-surface-2/);
  assert.match(html, />Click</);
});

test("each variant maps to distinct token-backed classes", () => {
  const primary = renderStatic(React.createElement(Button, { variant: "primary" }, "Go"));
  const danger = renderStatic(React.createElement(Button, { variant: "danger" }, "Delete"));
  const ghost = renderStatic(React.createElement(Button, { variant: "ghost" }, "Cancel"));
  assert.match(primary, /bg-brass-500/);
  assert.match(danger, /bg-danger-500/);
  assert.match(ghost, /text-text-secondary/);
});

test("passes through disabled and a caller's own type override", () => {
  const html = renderStatic(React.createElement(Button, { disabled: true, type: "submit" }, "Save"));
  assert.match(html, /disabled=""/);
  assert.match(html, /type="submit"/);
});
