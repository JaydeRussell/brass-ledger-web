import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Footer from "./footer.tsx";
import packageJson from "../../../package.json" with { type: "json" };

test("shows the current version, linked to /changelog", () => {
  const html = renderToStaticMarkup(React.createElement(Footer));
  assert.match(html, /Brass Ledger/);
  assert.match(html, /Early beta/);
  assert.match(html, new RegExp(`href="/changelog"[^>]*>v${packageJson.version.replace(/\./g, "\\.")}<`));
});
