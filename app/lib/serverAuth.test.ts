import { test, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// cookies() comes from next/headers, which only exists inside a render.
// One shared mutable value per test, same pattern as the page tests.
let cookieValue: string | undefined;
let cookiesThrows = false;

mock.module("next/headers", {
  namedExports: {
    cookies: async () => {
      if (cookiesThrows) throw new Error("no request context");
      return { get: (name: string) => (name === "session" && cookieValue ? { value: cookieValue } : undefined) };
    },
  },
});

const { resolveCurrentUserOnServer } = await import("./serverAuth.ts");

type FakeResponse = { status: number; body?: string };
let fetchCalls: Array<{ url: string; init?: RequestInit }> = [];

function installFetch(handler: () => FakeResponse | Promise<FakeResponse>) {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    fetchCalls.push({ url, init });
    const { status, body } = await handler();
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => JSON.parse(body ?? "null"),
    } as Response;
  }) as typeof fetch;
}

beforeEach(() => {
  cookieValue = undefined;
  cookiesThrows = false;
  fetchCalls = [];
});

test("no session cookie resolves to null without asking the backend", async () => {
  installFetch(() => ({ status: 200, body: "{}" }));

  assert.equal(await resolveCurrentUserOnServer(), null);
  assert.equal(
    fetchCalls.length,
    0,
    "a visitor with no session cookie is definitively signed out — spending a round trip to confirm it " +
      "would put a backend call on the critical path of every anonymous page render"
  );
});

test("a valid session resolves to the user, forwarding the cookie", async () => {
  cookieValue = "tok-123";
  installFetch(() => ({ status: 200, body: JSON.stringify({ id: 1, email: "a@b.com", status: "approved" }) }));

  const user = await resolveCurrentUserOnServer();

  assert.equal(user?.id, 1);
  assert.match(fetchCalls[0].url, /\/api\/me$/);
  assert.equal(
    (fetchCalls[0].init?.headers as Record<string, string>).cookie,
    "session=tok-123",
    "the session has to be forwarded explicitly — a server-side fetch carries no browser cookies"
  );
});

test("a 401 resolves to null, not undefined", async () => {
  cookieValue = "expired";
  installFetch(() => ({ status: 401 }));

  assert.equal(
    await resolveCurrentUserOnServer(),
    null,
    "the backend positively said 'not signed in', which is an answer — the client shouldn't re-ask"
  );
});

test("a failed lookup resolves to undefined so the client can retry", async () => {
  cookieValue = "tok-123";

  for (const [label, handler] of [
    ["a 500", () => ({ status: 500 })],
    ["a thrown network error", () => { throw new Error("connect ECONNREFUSED"); }],
  ] as const) {
    fetchCalls = [];
    installFetch(handler as () => FakeResponse);

    assert.equal(
      await resolveCurrentUserOnServer(),
      undefined,
      `${label} must resolve to undefined, not null. Treating a failed lookup as a confirmed ` +
        `sign-out would bounce a signed-in visitor to /login because their backend hiccuped`
    );
  }
});

test("no request context resolves to undefined rather than throwing", async () => {
  cookiesThrows = true;
  installFetch(() => ({ status: 200, body: "{}" }));

  assert.equal(
    await resolveCurrentUserOnServer(),
    undefined,
    "a render with no request to read (a static pass) knows nothing — it must not claim signed out"
  );
});
