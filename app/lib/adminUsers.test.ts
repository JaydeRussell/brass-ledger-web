import { test } from "node:test";
import assert from "node:assert/strict";

// Same fake-fetch-by-URL approach as myEvents.test.ts.
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

const { fetchAdminUsers, approveUser, rejectUser, setUserRole } = await import("./adminUsers.ts");

test("fetchAdminUsers: sends credentials and returns the parsed body", async () => {
  const wantBody = [
    { id: 1, email: "a@b.com", name: "A B", avatarUrl: "", bcpUserId: "", role: "user", status: "pending" },
    { id: 2, email: "c@d.com", name: "C D", avatarUrl: "", bcpUserId: "u2", role: "admin", status: "approved" },
  ];
  const { calls } = installFetch(() => ({ status: 200, body: wantBody }));

  const got = await fetchAdminUsers();

  assert.deepEqual(got, wantBody);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/admin/users"));
  assert.equal(calls[0].init?.credentials, "include");
});

test("fetchAdminUsers: a non-ok response throws using the backend's error message", async () => {
  installFetch(() => ({ status: 403, body: { error: "admin only" } }));
  await assert.rejects(() => fetchAdminUsers(), /admin only/);
});

test("approveUser: posts to the right path with credentials, no body expected back", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));

  await approveUser(42);

  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/admin/users/42/approve"));
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.credentials, "include");
});

test("rejectUser: posts to the right path", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));

  await rejectUser(7);

  assert.ok(calls[0].url.endsWith("/api/admin/users/7/reject"));
  assert.equal(calls[0].init?.method, "POST");
});

test("setUserRole: sends the role in the body", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));

  await setUserRole(9, "admin");

  assert.ok(calls[0].url.endsWith("/api/admin/users/9/role"));
  assert.deepEqual(JSON.parse(calls[0].init?.body as string), { role: "admin" });
});

test("setUserRole: surfaces the self-demotion error message", async () => {
  installFetch(() => ({ status: 400, body: { error: "can't demote your own account" } }));
  await assert.rejects(() => setUserRole(1, "user"), /can't demote your own account/);
});
