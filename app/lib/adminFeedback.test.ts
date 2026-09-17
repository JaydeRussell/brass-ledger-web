import { test } from "node:test";
import assert from "node:assert/strict";

// Same fake-fetch-by-URL approach as adminUsers.test.ts.
type FakeResponse = { status: number; body?: unknown };
type Call = { url: string; init?: RequestInit };

function installFetch(handler: (url: string, init?: RequestInit) => FakeResponse): { calls: Call[] } {
  const calls: Call[] = [];
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
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

const { fetchAdminFeedback, resolveFeedback, reopenFeedback, fetchOpenFeedbackCount } = await import(
  "./adminFeedback.ts"
);

test("fetchAdminFeedback: sends credentials and returns the parsed body", async () => {
  const wantBody = [
    {
      id: 1,
      kind: "bug",
      message: "Overview shows a blank page.",
      page: "/?event=abc123",
      contactEmail: "",
      submittedBy: "",
      status: "open",
      createdAt: "2026-09-16T12:00:00Z",
    },
  ];
  const { calls } = installFetch(() => ({ status: 200, body: wantBody }));

  const got = await fetchAdminFeedback();

  assert.deepEqual(got, wantBody);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/admin/feedback"));
  assert.equal(calls[0].init?.credentials, "include");
});

test("fetchAdminFeedback: a non-ok response throws using the backend's error message", async () => {
  installFetch(() => ({ status: 403, body: { error: "admin only" } }));
  await assert.rejects(() => fetchAdminFeedback(), /admin only/);
});

test("resolveFeedback: posts to the right path with credentials", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));

  await resolveFeedback(42);

  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/admin/feedback/42/resolve"));
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.credentials, "include");
});

test("reopenFeedback: posts to the right path", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));

  await reopenFeedback(7);

  assert.ok(calls[0].url.endsWith("/api/admin/feedback/7/reopen"));
  assert.equal(calls[0].init?.method, "POST");
});

test("fetchOpenFeedbackCount: unwraps {count} from the response", async () => {
  installFetch(() => ({ status: 200, body: { count: 3 } }));
  assert.equal(await fetchOpenFeedbackCount(), 3);
});
