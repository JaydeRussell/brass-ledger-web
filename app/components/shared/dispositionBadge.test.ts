import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DispositionBadge from "./dispositionBadge.tsx";

test("renders nothing when there's no disposition", () => {
  assert.equal(renderToStaticMarkup(React.createElement(DispositionBadge, {})), "");
  assert.equal(
    renderToStaticMarkup(React.createElement(DispositionBadge, { disposition: "" })),
    ""
  );
});

test("renders the disposition text when present", () => {
  const html = renderToStaticMarkup(React.createElement(DispositionBadge, { disposition: "Purge the Foe" }));
  assert.match(html, /<span/);
  assert.match(html, />Purge the Foe</);
});
