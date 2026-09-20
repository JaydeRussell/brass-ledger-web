import { test } from "node:test";
import assert from "node:assert/strict";

// logClientEvent's whole job is to mirror to the console method matching
// its level, with the message and context, and never to throw. (It used
// to also POST to /api/log — see clientLog.ts's own comment for why that
// went away.) Node's test runner shares one global console across tests,
// so each case captures and restores the method it asserts on.
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
    const captured = captureConsole(tc.consoleMethod);
    try {
      logClientEvent(tc.level, "something happened");
      assert.equal(captured.calls.length, 1, tc.name);
    } finally {
      captured.restore();
    }
  }
});

test("logClientEvent: passes the message and context through to the console", () => {
  const captured = captureConsole("log");
  let args: unknown[] = [];
  try {
    logClientEvent("info", "sign-in check started", { attempt: 1 });
    args = captured.calls[0];
  } finally {
    captured.restore();
  }

  assert.equal(args[0], "[info]");
  assert.equal(args[1], "sign-in check started");
  assert.deepEqual(args[2], { attempt: 1 });
});

test("logClientEvent: renders a missing context as an empty string, not undefined", () => {
  const captured = captureConsole("warn");
  let args: unknown[] = [];
  try {
    logClientEvent("warn", "no context here");
    args = captured.calls[0];
  } finally {
    captured.restore();
  }
  assert.equal(args[2], "");
});

test("logClientEvent: never throws, whatever the console does", () => {
  // Several call sites log from inside a catch block — a throw here
  // would replace the real error with a worse one.
  const original = console.error;
  console.error = () => {
    throw new Error("console is broken");
  };
  try {
    assert.doesNotThrow(() => logClientEvent("error", "boom"));
  } finally {
    console.error = original;
  }
});
