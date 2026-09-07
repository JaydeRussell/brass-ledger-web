import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { NavProvider, useNav } from "./navContext.tsx";
import { renderStatic } from "../../lib/testUtils.ts";

function Consumer() {
  const { isOpen } = useNav();
  return React.createElement("span", null, isOpen ? "open" : "closed");
}

test("useNav starts closed", () => {
  const html = renderStatic(React.createElement(NavProvider, null, React.createElement(Consumer)));
  assert.match(html, />closed</);
});

test("useNav throws outside a NavProvider", () => {
  assert.throws(() => renderStatic(React.createElement(Consumer)), /useNav must be used within a NavProvider/);
});
