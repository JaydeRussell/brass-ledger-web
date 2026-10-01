import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PopupSignInBridge from "./popupSignInBridge.tsx";

// Renders nothing; everything it does happens in a useEffect, which never
// runs under server rendering. The decision it makes on load (is this
// window the popup finishing a sign-in?) is lib/popupSignIn.ts's
// consumePendingSignIn, covered in that file's own tests. The popup
// hand-off itself can only be verified on a real installed iPhone.

test("renders nothing", () => {
  assert.equal(renderToStaticMarkup(React.createElement(PopupSignInBridge)), "");
});
