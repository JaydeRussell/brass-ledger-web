import { test } from "node:test";
import assert from "node:assert/strict";

// Same fake-fetch-by-URL approach as follows.test.ts/myEvents.test.ts.
type FakeResponse = { status: number; body?: unknown };
type Call = { url: string; init?: RequestInit };

function installFetch(handler: (url: string, init?: RequestInit) => FakeResponse): { calls: Call[] } {
  const calls: Call[] = [];
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (
    url: string,
    init?: RequestInit
  ) => {
    calls.push({ url, init });
    const { status, body } = handler(url, init);
    const text = body === undefined ? "" : JSON.stringify(body);
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => text,
    } as Response;
  }) as typeof fetch;
  return { calls };
}

const { submitFeedback } = await import("./feedback.ts");

test("submitFeedback: posts with credentials to /api/feedback, encoding the wire shape", async () => {
  const { calls } = installFetch(() => ({ status: 202 }));

  await submitFeedback({ kind: "bug", message: "Overview shows a blank page.", page: "/?event=abc123" });

  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/feedback"), calls[0].url);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.credentials, "include");
  assert.deepEqual(JSON.parse(calls[0].init?.body as string), {
    kind: "bug",
    message: "Overview shows a blank page.",
    page: "/?event=abc123",
    contactEmail: "",
  });
});

test("submitFeedback: defaults contactEmail to empty string when omitted", async () => {
  const { calls } = installFetch(() => ({ status: 202 }));

  await submitFeedback({ kind: "suggestion", message: "Add dark mode.", page: "/about" });

  assert.equal(JSON.parse(calls[0].init?.body as string).contactEmail, "");
});

test("submitFeedback: passes contactEmail through when given", async () => {
  const { calls } = installFetch(() => ({ status: 202 }));

  await submitFeedback({
    kind: "bug",
    message: "test",
    page: "/",
    contactEmail: "alice@example.com",
  });

  assert.equal(JSON.parse(calls[0].init?.body as string).contactEmail, "alice@example.com");
});

test("submitFeedback: a non-ok response throws using the backend's error message", async () => {
  installFetch(() => ({ status: 400, body: { error: "message is required" } }));
  await assert.rejects(
    () => submitFeedback({ kind: "bug", message: "", page: "/" }),
    /message is required/
  );
});

test("submitFeedback: a non-JSON error body falls back to a generic message", async () => {
  installFetch(() => ({ status: 500 }));
  await assert.rejects(
    () => submitFeedback({ kind: "bug", message: "test", page: "/" }),
    /HTTP 500/
  );
});
