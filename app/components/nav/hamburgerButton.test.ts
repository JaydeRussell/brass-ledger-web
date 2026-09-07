import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import HamburgerButton from "./hamburgerButton.tsx";
import { NavProvider } from "./navContext.tsx";
import { renderStatic } from "../../lib/testUtils.ts";

// HamburgerButton itself calls the useNav hook, so (unlike TabBar/SearchBar)
// it can't be called directly as a plain function to inspect its onClick —
// that needs an ancestor NavProvider and React's own render loop to supply
// the hooks dispatcher, and static server rendering can't simulate a click
// (no DOM to dispatch into — see app/lib/testUtils.ts). What's verified
// here is the accessible, always-true-regardless-of-state markup; that its
// onClick is wired to the shared nav context's open() is exercised
// end-to-end by navDrawer.test.ts, which renders the drawer open.

test("renders an accessible open-menu button inside a NavProvider", () => {
  const html = renderStatic(React.createElement(NavProvider, null, React.createElement(HamburgerButton)));
  assert.match(html, /aria-label="Open menu"/);
  assert.match(html, /<button/);
});

test("requires a NavProvider ancestor", () => {
  assert.throws(() => renderStatic(React.createElement(HamburgerButton)));
});
