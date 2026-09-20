import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "./navContext.tsx";
import NavDrawer, { preloadNavDrawerBody } from "./navDrawer.tsx";

// navDrawer.tsx is only the shell — the drawer's real contents live in
// navDrawerBody.tsx (and are covered by navDrawerBody.test.ts). What
// matters here is that the shell renders *nothing* until the body has
// been loaded, since that emptiness is the whole point: it's what keeps
// ui/dialog.tsx's Radix Dialog (~37 KB across three chunks) off every
// route's critical path.
//
// Both of the shell's mount triggers are effects (a requestIdleCallback
// and an isOpen watcher), and effects never run under a static SSR pass
// — see app/lib/testUtils.ts — so this only ever observes the
// not-yet-mounted state. That it actually loads and animates on open is
// verified live in a real browser, as with everything else Portal-backed
// in this project.

test("renders nothing until the drawer body has been loaded", () => {
  const html = renderToStaticMarkup(
    React.createElement(NavProvider, null, React.createElement(NavDrawer))
  );
  assert.equal(html, "");
});

test("exposes a preload entry point for hamburgerButton to call on hover", () => {
  assert.equal(typeof preloadNavDrawerBody, "function");
});
