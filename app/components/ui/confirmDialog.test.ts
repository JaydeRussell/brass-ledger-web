import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import ConfirmDialog from "./confirmDialog.tsx";

// Same Radix-Portal SSR limitation documented in dialog.test.ts: Portal
// content renders into document.body, which doesn't exist under
// renderToStaticMarkup's Node-only pass. These tests only confirm the
// component mounts and unmounts cleanly in both open states; the actual
// confirm/cancel click behavior needs a real browser (verified live for
// this PR's admin Reject flow).
test("mounts without throwing while open", () => {
  assert.doesNotThrow(() => {
    renderStatic(
      React.createElement(ConfirmDialog, {
        open: true,
        onOpenChange: () => {},
        title: "Reject this account?",
        onConfirm: () => {},
      })
    );
  });
});

test("mounts without throwing while closed", () => {
  assert.doesNotThrow(() => {
    renderStatic(
      React.createElement(ConfirmDialog, {
        open: false,
        onOpenChange: () => {},
        title: "Reject this account?",
        onConfirm: () => {},
      })
    );
  });
});
