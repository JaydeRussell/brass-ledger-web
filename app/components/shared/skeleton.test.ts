import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Skeleton from "./skeleton.tsx";

test("renders a pulsing, decorative (aria-hidden) block", () => {
  const html = renderToStaticMarkup(React.createElement(Skeleton));
  assert.match(html, /animate-pulse/);
  assert.match(html, /aria-hidden="true"/);
});

test("an extra className is appended, not replaced", () => {
  const html = renderToStaticMarkup(React.createElement(Skeleton, { className: "h-4 w-32" }));
  assert.match(html, /h-4 w-32/);
  assert.match(html, /animate-pulse/);
});
