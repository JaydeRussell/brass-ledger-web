import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// AccentThemeSync reads useCurrentUser() and does all its real work in an
// effect, which never runs under a static SSR pass (see
// app/lib/testUtils.ts). So what's assertable here is its contract with
// the layout that mounts it: it contributes no markup, in every auth
// state. The reconcile logic it calls is pure and covered directly by
// lib/theme.test.ts's reconcileAccountAccentTheme cases.
let mockState: { user: unknown; checked: boolean } = { user: null, checked: false };
mock.module("../../lib/auth.ts", {
  namedExports: { useCurrentUser: () => mockState },
});
const { default: AccentThemeSync } = await import("./accentThemeSync.tsx");

const SIGNED_IN = {
  id: 1,
  email: "ada@example.com",
  name: "Ada Lovelace",
  avatarUrl: "",
  bcpUserId: "",
  role: "user",
  status: "approved",
  accentTheme: "sanguine",
  dossierPublic: true,
};

for (const tc of [
  { name: "before the sign-in check resolves", state: { user: null, checked: false } },
  { name: "signed out", state: { user: null, checked: true } },
  { name: "signed in", state: { user: SIGNED_IN, checked: true } },
]) {
  test(`renders no markup ${tc.name}`, () => {
    mockState = tc.state;
    assert.equal(renderToStaticMarkup(React.createElement(AccentThemeSync)), "");
  });
}
