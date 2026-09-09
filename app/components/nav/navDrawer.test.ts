import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "./navContext.tsx";

// NavDrawer is now built on ui/dialog.tsx's Radix-backed Dialog, which
// portals its content to document.body. Under a plain react-dom/server
// static-SSR pass — no real DOM; see app/lib/testUtils.ts's note on why
// this project doesn't have jsdom yet — Radix's Portal renders nothing at
// all, so the drawer's actual content (the nav links, active-link
// highlighting, the account section) isn't inspectable via rendered HTML
// any more the way it was before this migration. What *is* still verified
// here: the component mounts cleanly, in both an open and closed state,
// given a real NavProvider/usePathname context, without throwing — a
// real (if shallow) regression check for wiring mistakes (a bad prop
// passed to Dialog, a missing provider, etc). The actual behavior this
// migration was for — focus trapping, Escape-to-close, active-link
// highlighting — was verified via a real browser during this change
// instead; deeper *automated* structural assertions need
// jsdom/@testing-library/react (confirmed installable, not yet wired up
// — see CLAUDE.md) to get real coverage of Portal-rendered content back.
//
// One shared mutable variable backing the mock, set per test right before
// rendering, rather than calling mock.module() again per test — a second
// mock.module() call for the same specifier isn't guaranteed to affect an
// already-linked ESM import binding the same way a plain mutation is.
let currentPath = "/";
mock.module("next/navigation", {
  namedExports: { usePathname: () => currentPath },
});
const { default: NavDrawer } = await import("./navDrawer.tsx");

test("mounts without throwing while closed", () => {
  currentPath = "/";
  assert.doesNotThrow(() => {
    renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(NavDrawer)));
  });
});

test("mounts without throwing regardless of the current path", () => {
  currentPath = "/my-events";
  assert.doesNotThrow(() => {
    renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(NavDrawer)));
  });
});
