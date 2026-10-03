import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DisplayMenu from "./displayMenu.tsx";

test("starts collapsed, hiding its settings", () => {
  const html = renderToStaticMarkup(
    React.createElement(DisplayMenu, null, React.createElement("span", null, "Text size"))
  );
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, />Display</);
  assert.ok(!html.includes("Text size"));
});
