import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommandPaletteProvider } from "./commandPaletteContext.tsx";

// Same mocking approach as feedbackWidget.test.ts. Only the closed
// (default) state is inspectable this way — opening the palette is a
// stateful transition (⌘K, or a click, flipping CommandPaletteProvider's
// own useState) a plain react-dom/server static-SSR pass can't simulate,
// same documented gap feedbackWidget.test.ts already has for its own
// open/closed toggle. Real CommandPaletteProvider is used (not mocked)
// — this codebase's context modules (see navDrawer.test.ts/
// calendar/page.test.ts's use of the real NavProvider) are always used
// for real in tests, never mocked directly; the open-state content
// (the input, the results list, ⌘K/Escape handling) was verified live
// in a real browser instead.
let authState: { user: unknown; checked: boolean; setUser: (u: unknown) => void } = {
  user: null,
  checked: false,
  setUser: () => {},
};
mock.module("../../lib/auth.ts", {
  namedExports: { useCurrentUser: () => authState },
});
mock.module("next/navigation", {
  namedExports: { useRouter: () => ({ push: () => {} }) },
});
mock.module("../../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });

const { default: CommandPalette } = await import("./commandPalette.tsx");

test("renders nothing while closed", () => {
  const html = renderToStaticMarkup(
    React.createElement(CommandPaletteProvider, null, React.createElement(CommandPalette))
  );
  assert.equal(html, "");
});

test("mounts without throwing regardless of sign-in state", () => {
  authState = {
    user: { id: 1, email: "a@example.com", name: "Admin", role: "admin", status: "approved" },
    checked: true,
    setUser: () => {},
  };
  assert.doesNotThrow(() => {
    renderToStaticMarkup(
      React.createElement(CommandPaletteProvider, null, React.createElement(CommandPalette))
    );
  });
  authState = { user: null, checked: false, setUser: () => {} }; // reset for later tests
});
