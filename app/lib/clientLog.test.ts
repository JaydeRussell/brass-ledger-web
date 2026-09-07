import { test } from "node:test";
import assert from "node:assert/strict";

// logClientEvent's job is: mirror to the right console method, and POST
// a JSON body to /api/log without ever throwing — even when fetch
// itself rejects. Same fake-fetch-by-URL approach as bcp.test.ts and
// auth.test.ts, plus capturing/restoring the console methods it mirrors
// to (Node's test runner shares one global console across tests, so
// each case must put it back the way it found it).
type Call = { url: string; init?: RequestInit };

function installFetch(behavior: "resolve" | "reject"): { calls: Call[] } {
  const calls: Call[] = [];
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (
    url: string,
    init?: RequestInit
  ) => {
    calls.push({ url, init });
    if (behavior === "reject") throw new Error("network error");
    return { ok: true, status: 204 } as Response;
  }) as typeof fetch;
  return { calls };
}

function captureConsole(method: "log" | "warn" | "error"): { calls: unknown[][]; restore: () => void } {
  const original = console[method];
  const calls: unknown[][] = [];
  console[method] = ((...args: unknown[]) => {
    calls.push(args);
  }) as typeof console.log;
  return { calls, restore: () => (console[method] = original) };
}

const { logClientEvent } = await import("./clientLog.ts");

test("logClientEvent: mirrors to the console method matching each level", () => {
  const cases: { name: string; level: "info" | "warn" | "error"; consoleMethod: "log" | "warn" | "error" }[] = [
    { name: "info mirrors to console.log", level: "info", consoleMethod: "log" },
    { name: "warn mirrors to console.warn", level: "warn", consoleMethod: "warn" },
    { name: "error mirrors to console.error", level: "error", consoleMethod: "error" },
  ];

  for (const tc of cases) {
    installFetch("resolve");
    const captured = captureConsole(tc.consoleMethod);
    try {
      logClientEvent(tc.level, "something happened");
      assert.equal(captured.calls.length, 1, tc.name);
    } finally {
      captured.restore();
    }
  }
});

test("logClientEvent: POSTs a JSON body to /api/log with the level, message, and context", async () => {
  const { calls } = installFetch("resolve");
  const captured = captureConsole("log");
  try {
    logClientEvent("info", "sign-in check started", { attempt: 1 });
  } finally {
    captured.restore();
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/log");
  assert.equal(calls[0].init?.method, "POST");
  const body = JSON.parse(calls[0].init?.body as string);
  assert.equal(body.level, "info");
  assert.equal(body.message, "sign-in check started");
  assert.deepEqual(body.context, { attempt: 1 });
  assert.ok(body.timestamp, "should include a timestamp");
});

test("logClientEvent: a rejected fetch never throws or rejects", async () => {
  installFetch("reject");
  const captured = captureConsole("error");
  try {
    // logClientEvent is synchronous from the caller's point of view —
    // it fires the POST and returns without awaiting it, so this must
    // not throw even though the underlying fetch will go on to reject.
    assert.doesNotThrow(() => logClientEvent("error", "boom"));
  } finally {
    captured.restore();
  }
  // Give the fire-and-forget fetch's rejection a turn to be handled (by
  // logClientEvent's own .catch) before the test ends, so an unhandled
  // rejection from this test doesn't leak into whichever test runs next.
  await new Promise((resolve) => setTimeout(resolve, 0));
});
