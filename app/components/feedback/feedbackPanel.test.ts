import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// The form that feedbackWidget.tsx lazily loads. Covers the structural
// assertions that used to live in feedbackWidget.test.ts's open state —
// which that test could never actually reach, since opening the panel is
// a stateful transition a static SSR pass can't simulate. Rendering the
// panel directly, as the widget does once loaded, makes it inspectable.
let mockUser: unknown = null;
mock.module("../../lib/auth.ts", { namedExports: { useCurrentUser: () => ({ user: mockUser }) } });
mock.module("next/navigation", { namedExports: { usePathname: () => "/event" } });
mock.module("../../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });
mock.module("../../lib/feedback.ts", {
  namedExports: { submitFeedback: async () => {} },
});
const { default: FeedbackPanel } = await import("./feedbackPanel.tsx");

const render = () => renderToStaticMarkup(React.createElement(FeedbackPanel, { onClose: () => {} }));

test("renders the report form as a modal dialog", () => {
  mockUser = null;
  const html = render();
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /Report a bug or suggestion/);
  assert.match(html, /<textarea/);
  assert.match(html, /Send</);
});

test("offers both a bug and a suggestion kind", () => {
  mockUser = null;
  const html = render();
  assert.match(html, /[Bb]ug/);
  assert.match(html, /[Ss]uggestion/);
});

test("names the signed-in account it will attach, and omits that line when signed out", () => {
  mockUser = { id: 1, email: "ada@example.com", name: "Ada Lovelace" };
  assert.match(render(), /Submitting as Ada Lovelace \(ada@example\.com\)/);

  mockUser = null;
  assert.ok(!render().includes("Submitting as"));
});
