import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DisplaySettings from "./displaySettings.tsx";

const groups = (html: string) => html.split('role="radiogroup"').slice(1);

test("renders four text sizes and three densities, defaults selected, contrast off", () => {
  const html = renderToStaticMarkup(React.createElement(DisplaySettings));
  const [textSizes, densities] = groups(html);
  assert.equal(textSizes.match(/role="radio"/g)?.length, 4);
  assert.match(textSizes, /aria-checked="true" aria-label="Default"/);
  assert.equal(densities.match(/role="radio"/g)?.length, 3);
  assert.match(densities, /aria-checked="true"[^>]*>Default</);
  assert.match(html, /role="switch" aria-checked="false" aria-label="Higher contrast"/);
});
