import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// AccountSection's entire rendering depends on useCurrentUser() (from
// ../../lib/auth), which does a real fetch-on-mount — mocked out here the
// same way this project's other hook-heavy components are (see
// navDrawer.test.ts's note on why one shared mutable variable, set per
// test, is used instead of calling mock.module() again for each case).
let mockState: { user: unknown; checked: boolean; setUser: (u: unknown) => void } = {
  user: null,
  checked: false,
  setUser: () => {},
};
mock.module("../../lib/auth.ts", {
  namedExports: {
    useCurrentUser: () => mockState,
    googleSignInUrl: (returnTo?: string) =>
      `http://localhost:8080/auth/google/login${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ""}`,
    signOut: async () => {},
  },
});
// usePathname needs a real Next.js App Router context to work outside of
// one (as here, a plain react-dom/server pass) it throws — same mocking
// approach as navDrawer.test.ts.
mock.module("next/navigation", {
  namedExports: { usePathname: () => "/stats" },
});
const { default: AccountSection } = await import("./accountSection.tsx");

test("reserves height without content while the initial check is in flight", () => {
  mockState = { user: null, checked: false, setUser: () => {} };
  const html = renderToStaticMarkup(React.createElement(AccountSection));
  assert.ok(!html.includes("Sign in"));
  assert.match(html, /h-\[65px\]/);
});

test("shows a sign-in link once checked and signed out, carrying the current path as return_to", () => {
  mockState = { user: null, checked: true, setUser: () => {} };
  const html = renderToStaticMarkup(React.createElement(AccountSection));
  assert.match(html, /Sign in with Google/);
  assert.match(html, /href="http:\/\/localhost:8080\/auth\/google\/login\?return_to=%2Fstats"/);
});

test("shows the signed-in user's name, email, and initials avatar when there's no avatar URL", () => {
  mockState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "ada@example.com", name: "Ada Lovelace", avatarUrl: "", bcpUserId: "" },
  };
  const html = renderToStaticMarkup(React.createElement(AccountSection));
  assert.match(html, /Ada Lovelace/);
  assert.match(html, /ada@example\.com/);
  assert.match(html, />AL</); // initials, no <img> since avatarUrl is empty
  assert.ok(!html.includes("<img"));
  assert.match(html, /Sign out/);
});

test("shows an <img> avatar when the user has one", () => {
  mockState = {
    checked: true,
    setUser: () => {},
    user: {
      id: 1,
      email: "ada@example.com",
      name: "Ada Lovelace",
      avatarUrl: "https://example.com/avatar.png",
      bcpUserId: "",
    },
  };
  const html = renderToStaticMarkup(React.createElement(AccountSection));
  assert.match(html, /<img[^>]*src="https:\/\/example\.com\/avatar\.png"/);
});
