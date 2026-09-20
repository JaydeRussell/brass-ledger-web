import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommandPaletteProvider } from "./commandPaletteContext.tsx";
import CommandPalette from "./commandPalette.tsx";

// commandPalette.tsx is only the shell — the palette's real contents
// live in commandPaletteBody.tsx and are covered by
// commandPaletteBody.test.ts. Two things matter here:
//
//  - it renders nothing until opened, which is what keeps the body's
//    chunk off every route's critical path, and
//  - it owns the global ⌘K listener rather than the body, so the
//    shortcut works on a page where the body has never been loaded.
//
// The listener is registered in an effect, and effects don't run under a
// static SSR pass (see app/lib/testUtils.ts), so the binding itself is
// verified live in a real browser.

test("renders nothing while closed", () => {
  const html = renderToStaticMarkup(
    React.createElement(CommandPaletteProvider, null, React.createElement(CommandPalette))
  );
  assert.equal(html, "");
});

test("does not pull the palette body in as a static import", async () => {
  // If the body were statically imported, importing the shell would drag
  // its whole module graph (next/navigation, recentEvents, bcp, …) in
  // with it — the thing this split exists to prevent.
  const shellSource = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./commandPalette.tsx", import.meta.url), "utf8")
  );
  assert.ok(!/^import .*commandPaletteBody/m.test(shellSource));
  assert.match(shellSource, /import\("\.\/commandPaletteBody"\)/);
});
