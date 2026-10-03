import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DisplaySettings from "./displaySettings.tsx";

test("renders four text sizes with Default selected, and the contrast switch off", () => {
  const html = renderToStaticMarkup(React.createElement(DisplaySettings));
  assert.equal(html.match(/role="radio"/g)?.length, 4);
  assert.match(html, /aria-checked="true" aria-label="Default"/);
  assert.match(html, /role="switch" aria-checked="false" aria-label="Higher contrast"/);
});
