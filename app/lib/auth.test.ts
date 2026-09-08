import { test } from "node:test";
import assert from "node:assert/strict";

// Every exported function in auth.ts calls this app's own backend via
// fetch() with credentials: "include" (session state lives in an
// httpOnly cookie), so these tests install a fake global fetch and
// assert on both the response handling and the request options actually
// sent — same fake-fetch-by-URL approach as bcp.test.ts, extended to
// also capture each call's init object so `credentials` can be checked.
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
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }) as typeof fetch;
  return { calls };
}

const { googleSignInUrl, fetchCurrentUser, signOut } = await import("./auth.ts");

test("googleSignInUrl: points at the backend's login route", () => {
  const url = googleSignInUrl();
  assert.ok(url.endsWith("/auth/google/login"), `URL was ${url}`);
});

test("googleSignInUrl: with a returnTo, appends it as an encoded return_to param", () => {
  const url = googleSignInUrl("/stats?tab=past");
  assert.ok(
    url.endsWith("/auth/google/login?return_to=%2Fstats%3Ftab%3Dpast"),
    `URL was ${url}`
  );
});

test("fetchCurrentUser", async () => {
  const cases: {
    name: string;
    status: number;
    body?: unknown;
    want: "user" | "null" | "throws";
  }[] = [
    {
      name: "200 with a user body resolves to that user",
      status: 200,
      body: { id: 1, email: "a@example.com", name: "Anna", avatarUrl: "https://example.com/a.png" },
      want: "user",
    },
    { name: "401 (not signed in) resolves to null, not an error", status: 401, want: "null" },
    { name: "an unexpected error status throws", status: 500, want: "throws" },
  ];

  for (const tc of cases) {
    installFetch(() => ({ status: tc.status, body: tc.body }));

    if (tc.want === "throws") {
      await assert.rejects(() => fetchCurrentUser(), /HTTP 500/, tc.name);
      continue;
    }

    const user = await fetchCurrentUser();
    if (tc.want === "null") {
      assert.equal(user, null, tc.name);
    } else {
      assert.deepEqual(user, tc.body, tc.name);
    }
  }
});

test("fetchCurrentUser: sends credentials so the session cookie is included", async () => {
  const { calls } = installFetch(() => ({ status: 401 }));
  await fetchCurrentUser();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.credentials, "include");
});

test("signOut", async () => {
  const cases: { name: string; status: number; wantThrows: boolean }[] = [
    { name: "204 succeeds silently", status: 204, wantThrows: false },
    { name: "a non-ok response throws", status: 500, wantThrows: true },
  ];

  for (const tc of cases) {
    installFetch(() => ({ status: tc.status }));
    if (tc.wantThrows) {
      await assert.rejects(() => signOut(), /HTTP 500/, tc.name);
    } else {
      await assert.doesNotReject(() => signOut(), tc.name);
    }
  }
});

test("signOut: POSTs with credentials included", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));
  await signOut();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.credentials, "include");
});
