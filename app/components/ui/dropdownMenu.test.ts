import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./dropdownMenu.tsx";

// Radix's DropdownMenu.Portal renders Content into `document.body`,
// which doesn't exist under renderToStaticMarkup's Node-only SSR pass —
// so, confirmed directly, only the Trigger (rendered outside the portal)
// shows up in static output; Content/Item never do, open or closed. What
// this genuinely verifies: the Trigger renders correctly (real ARIA
// wiring from Radix itself — aria-haspopup/aria-expanded/aria-controls),
// and the whole tree mounts without throwing. The popover content's
// actual rendering, keyboard nav (arrow keys), and outside-click/Escape
// behavior — the reason this replaces eventSettings.tsx's hand-rolled
// dropdown — are unverified here; see dialog.test.ts's note on the same
// underlying limitation.
test("trigger renders with Radix's own ARIA wiring, reflecting open state", () => {
  const html = renderStatic(
    React.createElement(
      DropdownMenu,
      { open: true },
      React.createElement(DropdownMenuTrigger, { asChild: true }, React.createElement("button", null, "Open")),
      React.createElement(DropdownMenuContent, null, React.createElement(DropdownMenuItem, null, "Item"))
    )
  );
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, />Open</);
});

test("mounts without throwing while closed", () => {
  assert.doesNotThrow(() => {
    renderStatic(
      React.createElement(
        DropdownMenu,
        { open: false },
        React.createElement(DropdownMenuTrigger, { asChild: true }, React.createElement("button", null, "Open")),
        React.createElement(DropdownMenuContent, null, React.createElement(DropdownMenuItem, null, "Item"))
      )
    );
  });
});
