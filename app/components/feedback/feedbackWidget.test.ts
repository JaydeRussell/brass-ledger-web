import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// FeedbackWidget's rendering depends on useCurrentUser() (a real
// fetch-on-mount, see ../../lib/auth.ts) and usePathname() (throws
// outside a real Next.js App Router context) — mocked here the same way
// this project's other hook-heavy components are (see
// accountSection.test.ts's identical setup).
let mockState: { user: unknown; checked: boolean; setUser: (u: unknown) => void } = {
  user: null,
  checked: false,
  setUser: () => {},
};
mock.module("../../lib/auth.ts", {
  namedExports: { useCurrentUser: () => mockState },
});
mock.module("next/navigation", {
  namedExports: { usePathname: () => "/stats" },
});
const { default: FeedbackWidget } = await import("./feedbackWidget.tsx");

// Only the closed (default) state is inspectable this way: opening the
// widget is a stateful transition (a click flipping useState's isOpen)
// that a plain react-dom/server static-SSR pass can't simulate — no DOM,
// no events — same documented gap as eventSettings.test.ts's dropdown-
// open case (see app/lib/testUtils.ts's file-level comment). The form
// itself (submitting, the success/error states) was verified live in a
// real browser instead.

test("renders a labeled floating button, not the form, before it's opened", () => {
  const html = renderToStaticMarkup(React.createElement(FeedbackWidget));
  assert.match(html, /Feedback</);
  assert.match(html, /aria-label="Report a bug or suggest something"/);
  assert.ok(!html.includes("What went wrong?"), "form should not be rendered while closed");
  assert.ok(!html.includes('role="dialog"'), "dialog panel should not be rendered while closed");
});

test("mounts without throwing regardless of sign-in state", () => {
  mockState = { user: null, checked: true, setUser: () => {} };
  assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(FeedbackWidget)));

  mockState = {
    user: { id: 1, name: "Alice", email: "alice@example.com" },
    checked: true,
    setUser: () => {},
  };
  assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(FeedbackWidget)));
});

test("mounts without throwing regardless of the current path", () => {
  assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(FeedbackWidget)));
});
