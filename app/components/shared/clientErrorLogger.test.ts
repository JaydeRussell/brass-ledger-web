import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ClientErrorLogger from "./clientErrorLogger.tsx";

// This component renders nothing — all of its actual behavior (wiring
// window's "error"/"unhandledrejection" listeners to logClientEvent) lives
// inside a useEffect, which never runs under server rendering (and this
// sandboxed environment has no DOM/jsdom to mount it into for real — see
// app/lib/testUtils.ts). So the only thing verifiable here is the
// contract every caller relies on: it's safe to mount and renders nothing.

test("renders nothing", () => {
  assert.equal(renderToStaticMarkup(React.createElement(ClientErrorLogger)), "");
});
