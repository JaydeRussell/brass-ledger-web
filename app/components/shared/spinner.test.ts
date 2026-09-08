import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Spinner from "./spinner.tsx";

test("renders a spinning, decorative (aria-hidden) SVG", () => {
  const html = renderToStaticMarkup(React.createElement(Spinner));
  assert.match(html, /animate-spin/);
  assert.match(html, /aria-hidden="true"/);
});

test("size prop selects the size class, defaulting to md", () => {
  const md = renderToStaticMarkup(React.createElement(Spinner));
  assert.match(md, /h-6 w-6/);

  const sm = renderToStaticMarkup(React.createElement(Spinner, { size: "sm" }));
  assert.match(sm, /h-3\.5 w-3\.5/);
});

test("an extra className is appended, not replaced", () => {
  const html = renderToStaticMarkup(React.createElement(Spinner, { className: "ml-2" }));
  assert.match(html, /ml-2/);
  assert.match(html, /animate-spin/);
});
