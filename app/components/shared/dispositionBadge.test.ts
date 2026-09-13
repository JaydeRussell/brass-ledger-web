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
  assert.match(html, />Purge</);
});

test("abbreviates and color-codes each of the five known dispositions", () => {
  const cases: Array<[string, string, string]> = [
    ["Purge the Foe", "Purge", "danger"],
    ["Reconnaissance", "Recon", "neutral"],
    ["Priority Assets", "Priority", "warning"],
    ["Take and Hold", "T&H", "success"],
    ["Disruption", "Disruption", "brass"],
  ];
  for (const [disposition, label, tone] of cases) {
    const html = renderToStaticMarkup(React.createElement(DispositionBadge, { disposition }));
    const escapedLabel = label.replace(/&/g, "&amp;");
    assert.match(html, new RegExp(`>${escapedLabel}<`), `${disposition} should render as "${label}"`);
    if (tone === "danger" || tone === "success" || tone === "warning") {
      assert.match(html, new RegExp(`${tone}-500`), `${disposition} should use the ${tone} tone`);
    }
  }
});

test("shows an unrecognized disposition value as-is in a neutral tone", () => {
  const html = renderToStaticMarkup(React.createElement(DispositionBadge, { disposition: "Something New" }));
  assert.match(html, />Something New</);
  assert.match(html, /bg-surface-2/);
});
