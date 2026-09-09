import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavProvider } from "../components/nav/navContext.tsx";

// Same mocking approach as the other page tests (see my-events/page.test.ts's
// note): lib/auth does a real fetch on mount, and next/navigation needs a
// real App Router context.
let authState: { user: unknown; checked: boolean; setUser: (u: unknown) => void } = {
  user: null,
  checked: false,
  setUser: () => {},
};
let searchParamsValue = new URLSearchParams();

mock.module("../lib/auth.ts", {
  namedExports: {
    useCurrentUser: () => authState,
    googleSignInUrl: (returnTo?: string) =>
      `http://localhost:8080/auth/google/login${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ""}`,
  },
});
mock.module("next/navigation", {
  namedExports: {
    useRouter: () => ({ replace: () => {} }),
    useSearchParams: () => searchParamsValue,
  },
});

const { default: LoginPage } = await import("./page.tsx");

// The page's own HamburgerButton needs a NavProvider ancestor — normally
// supplied once by app/layout.tsx.
function renderPage(): string {
  return renderToStaticMarkup(React.createElement(NavProvider, null, React.createElement(LoginPage)));
}

test("shows nothing but the header while the sign-in check is in flight", () => {
  authState = { user: null, checked: false, setUser: () => {} };
  searchParamsValue = new URLSearchParams();
  const html = renderPage();
  assert.match(html, /Brass Ledger/);
  assert.ok(!html.includes("Continue with Google"));
});

test("shows a single Continue-with-Google button once checked and signed out", () => {
  authState = { user: null, checked: true, setUser: () => {} };
  searchParamsValue = new URLSearchParams();
  const html = renderPage();
  assert.match(html, /Continue with Google/);
  assert.match(html, /href="http:\/\/localhost:8080\/auth\/google\/login"/);
  // Only one entry point, not separate "sign in"/"sign up" buttons — see
  // page.tsx's doc comment for why.
  assert.equal((html.match(/Continue with Google/g) ?? []).length, 1);
});

test("carries a safe return_to through to the Google sign-in URL", () => {
  authState = { user: null, checked: true, setUser: () => {} };
  searchParamsValue = new URLSearchParams({ return_to: "/stats" });
  const html = renderPage();
  assert.match(html, /href="http:\/\/localhost:8080\/auth\/google\/login\?return_to=%2Fstats"/);
});

test("drops an unsafe return_to rather than passing it through", () => {
  authState = { user: null, checked: true, setUser: () => {} };
  searchParamsValue = new URLSearchParams({ return_to: "https://evil.example.com" });
  const html = renderPage();
  assert.match(html, /href="http:\/\/localhost:8080\/auth\/google\/login"/);
  assert.ok(!html.includes("evil.example.com"));
});

// The actual router.replace(...) call for an already-signed-in visitor
// lives in a useEffect, which (like every effect in this codebase's
// tests — see welcome/page.test.ts's note) doesn't run under a static
// SSR pass. What *is* verified: the render output shows no sign-in
// button at all once signed in, regardless of whether the effect has
// fired yet.
test("shows nothing for an already-signed-in visitor (the redirect effect takes it from here)", () => {
  authState = {
    checked: true,
    setUser: () => {},
    user: { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "u1", role: "user", status: "approved" },
  };
  searchParamsValue = new URLSearchParams();
  const html = renderPage();
  assert.ok(!html.includes("Continue with Google"));
});
