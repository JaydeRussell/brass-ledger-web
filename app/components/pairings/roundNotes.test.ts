import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Same mocking approach as feedbackWidget.test.ts. Only the collapsed
// (default) state is inspectable this way — expanding is a stateful
// transition (a click flipping useState) a plain react-dom/server
// static-SSR pass can't simulate; the fetch/save flow itself was
// verified live in a real browser instead.
let authState: { user: unknown; checked: boolean; setUser: (u: unknown) => void } = {
  user: null,
  checked: false,
  setUser: () => {},
};
mock.module("../../lib/auth.ts", {
  namedExports: { useCurrentUser: () => authState },
});
mock.module("../../lib/clientLog.ts", { namedExports: { logClientEvent: () => {} } });

const { default: RoundNotes } = await import("./roundNotes.tsx");

test("renders nothing for a signed-out visitor", () => {
  authState = { user: null, checked: true, setUser: () => {} };
  const html = renderToStaticMarkup(React.createElement(RoundNotes, { eventId: "evt-1", round: 3 }));
  assert.equal(html, "");
});

test("renders nothing for a signed-in but not-yet-approved account", () => {
  authState = {
    user: { id: 1, email: "a@example.com", name: "Anna", status: "pending" },
    checked: true,
    setUser: () => {},
  };
  const html = renderToStaticMarkup(React.createElement(RoundNotes, { eventId: "evt-1", round: 3 }));
  assert.equal(html, "");
});

test("an approved account gets a collapsed 'Add notes' trigger, not the textarea", () => {
  authState = {
    user: { id: 1, email: "a@example.com", name: "Anna", status: "approved" },
    checked: true,
    setUser: () => {},
  };
  const html = renderToStaticMarkup(React.createElement(RoundNotes, { eventId: "evt-1", round: 3 }));
  assert.match(html, /Add notes for this round/);
  assert.ok(!html.includes("<textarea"), "textarea should not render while collapsed");
});
