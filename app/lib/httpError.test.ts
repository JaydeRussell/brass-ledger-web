import { test } from "node:test";
import assert from "node:assert/strict";

import { httpErrorMessage } from "./httpError.ts";

test("a rate-limited request gets an actionable message", () => {
  assert.match(httpErrorMessage(429), /Wait a few seconds/);
  assert.equal(httpErrorMessage(500), "Request failed: HTTP 500");
});
