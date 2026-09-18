import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { ToastProvider, useToast, useToastViewport } from "./toastContext.tsx";
import { renderStatic } from "../../lib/testUtils.ts";

function Consumer() {
  const { showToast } = useToast();
  return React.createElement("span", null, typeof showToast);
}

function ViewportConsumer() {
  const { toasts } = useToastViewport();
  return React.createElement("span", null, `${toasts.length} toasts`);
}

test("useToast starts with no toasts and a callable showToast", () => {
  const html = renderStatic(React.createElement(ToastProvider, null, React.createElement(Consumer)));
  assert.match(html, />function</);
});

test("useToastViewport starts empty", () => {
  const html = renderStatic(React.createElement(ToastProvider, null, React.createElement(ViewportConsumer)));
  assert.match(html, />0 toasts</);
});

test("useToast throws outside a ToastProvider", () => {
  assert.throws(() => renderStatic(React.createElement(Consumer)), /useToast must be used within a ToastProvider/);
});

test("useToastViewport throws outside a ToastProvider", () => {
  assert.throws(
    () => renderStatic(React.createElement(ViewportConsumer)),
    /useToastViewport must be used within a ToastProvider/
  );
});
