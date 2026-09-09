import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import { Dialog } from "./dialog.tsx";

// Radix's Dialog.Portal (like DropdownMenu's, see dropdownMenu.test.ts's
// same note) renders into `document.body` — nonexistent under
// renderToStaticMarkup's Node-only SSR pass, so this component's actual
// panel content, its slide-in transform classes, and its
// focus-trap/Escape-to-close behavior are NOT exercised by anything
// below. What these tests genuinely confirm: the component mounts and
// unmounts cleanly (open and closed) without throwing, for both prop
// states real callers pass. Real coverage of the interactive behavior
// this component exists to add (over the hand-rolled panel it replaces)
// needs either a real browser or a jsdom-backed test runner — this
// project doesn't have the latter wired up yet (confirmed jsdom +
// @testing-library/react are installable now, unlike when that decision
// was last made, but adopting them is its own decision, not something to
// fold into this component's own build).
test("mounts without throwing while open", () => {
  assert.doesNotThrow(() => {
    renderStatic(
      React.createElement(Dialog, { open: true, onOpenChange: () => {}, title: "Navigation" }, "content")
    );
  });
});

test("mounts without throwing while closed", () => {
  assert.doesNotThrow(() => {
    renderStatic(
      React.createElement(Dialog, { open: false, onOpenChange: () => {}, title: "Navigation" }, "content")
    );
  });
});
