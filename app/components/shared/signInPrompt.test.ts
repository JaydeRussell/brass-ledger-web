import { test, mock } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("../../lib/auth.ts", {
  namedExports: {
    googleSignInUrl: (returnTo?: string) =>
      `http://localhost:8080/auth/google/login${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ""}`,
  },
});
mock.module("next/navigation", {
  namedExports: { usePathname: () => "/stats" },
});
const { default: SignInPrompt } = await import("./signInPrompt.tsx");

test("renders the given message and a sign-in link carrying the current path as return_to", () => {
  const html = renderToStaticMarkup(React.createElement(SignInPrompt, { message: "see your player stats." }));
  assert.match(html, /Sign in to see your player stats\./);
  assert.match(html, /Sign in with Google/);
  assert.match(html, /href="http:\/\/localhost:8080\/auth\/google\/login\?return_to=%2Fstats"/);
});
