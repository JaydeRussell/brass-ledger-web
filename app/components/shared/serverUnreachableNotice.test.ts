import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ServerUnreachableNotice from "./serverUnreachableNotice.tsx";
import { CurrentUserProvider } from "../../lib/auth.ts";

// The visible state needs a failed client-side /api/me lookup, which only
// happens in an effect; it is checked in a real browser with the backend
// blocked. These cover the states that must render nothing.

test("renders nothing before the sign-in check resolves", () => {
  assert.equal(renderToStaticMarkup(React.createElement(ServerUnreachableNotice)), "");
});

test("renders nothing for a confirmed signed-out visitor", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      CurrentUserProvider,
      { initialUser: null } as React.ComponentProps<typeof CurrentUserProvider>,
      React.createElement(ServerUnreachableNotice)
    )
  );
  assert.equal(html, "");
});
