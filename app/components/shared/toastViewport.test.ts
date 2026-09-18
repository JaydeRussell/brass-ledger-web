import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { ToastProvider } from "./toastContext.tsx";
import ToastViewport from "./toastViewport.tsx";
import { renderStatic } from "../../lib/testUtils.ts";

// A static SSR pass only ever sees the provider's initial (empty) toast
// list — showToast is only reachable from a real click/interaction, and
// the auto-dismiss timer needs a real DOM to run at all. Actually adding
// a toast, watching it auto-dismiss, and dismissing it by hand are all
// verified live in a real browser instead — same carve-out testUtils.ts's
// own doc comment describes for any other stateful-transition case.

test("renders an empty, aria-live list with nothing shown yet", () => {
  const html = renderStatic(React.createElement(ToastProvider, null, React.createElement(ToastViewport)));
  assert.match(html, /aria-live="polite"/);
  assert.ok(!html.includes("<li"));
});
