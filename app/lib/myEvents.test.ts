import { test } from "node:test";
import assert from "node:assert/strict";

// Same fake-fetch-by-URL approach as auth.test.ts, extended to also
// capture each call's init object so credentials/method/body can be
// checked (myEvents.ts always sends credentials: "include").
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

const { parseBcpUserId, linkBcpProfile, fetchMyEvents } = await import("./myEvents.ts");

test("parseBcpUserId", () => {
  const cases: { name: string; input: string; want: string }[] = [
    {
      name: "pulls the id out of a full profile URL",
      input: "https://www.bestcoastpairings.com/user/L8GE7LCQ0B",
      want: "L8GE7LCQ0B",
    },
    {
      name: "handles a trailing query string",
      input: "https://www.bestcoastpairings.com/user/L8GE7LCQ0B?league=abc",
      want: "L8GE7LCQ0B",
    },
    { name: "passes a bare id straight through", input: "L8GE7LCQ0B", want: "L8GE7LCQ0B" },
    { name: "trims surrounding whitespace", input: "  L8GE7LCQ0B  ", want: "L8GE7LCQ0B" },
    {
      // What you get copying a request URL out of the browser's Network
      // tab while on BCP's own "my account" page, which — unlike a
      // ranked player's public leaderboard entry — doesn't link to a
      // /user/ profile URL anywhere in its UI.
      name: "pulls the id out of a copied API request URL (/v1/users/...)",
      input:
        "https://newprod-api.bestcoastpairings.com/v1/users/98c5KuLmdpgS?&expand%5B%5D=team&expand%5B%5D=bankAccount",
      want: "98c5KuLmdpgS",
    },
    { name: "empty input stays empty", input: "", want: "" },
  ];

  for (const tc of cases) {
    assert.equal(parseBcpUserId(tc.input), tc.want, tc.name);
  }
});

test("linkBcpProfile: parses the input and sends it with credentials", async () => {
  const { calls } = installFetch(() => ({ status: 200, body: { bcpUserId: "L8GE7LCQ0B" } }));

  const got = await linkBcpProfile("https://www.bestcoastpairings.com/user/L8GE7LCQ0B");

  assert.equal(got, "L8GE7LCQ0B");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.credentials, "include");
  assert.deepEqual(JSON.parse(calls[0].init?.body as string), { bcpUserId: "L8GE7LCQ0B" });
});

test("linkBcpProfile: a non-ok response throws using the backend's error message", async () => {
  installFetch(() => ({ status: 400, body: { error: "invalid BCP profile" } }));
  await assert.rejects(() => linkBcpProfile("bad-input"), /invalid BCP profile/);
});

test("fetchMyEvents: sends credentials and returns the parsed body", async () => {
  const wantBody = {
    linked: true,
    past: [{ eventId: "evt-1", eventName: "Old Event", placing: 4 }],
    present: [],
    future: [{ eventId: "evt-2", eventName: "Upcoming" }],
    upcomingFetchedAt: "2026-01-01T00:00:00Z",
  };
  const { calls } = installFetch(() => ({ status: 200, body: wantBody }));

  const got = await fetchMyEvents();

  assert.deepEqual(got, wantBody);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/me/events"));
  assert.equal(calls[0].init?.credentials, "include");
});

test("fetchMyEvents: refresh=true appends the query param", async () => {
  const { calls } = installFetch(() => ({
    status: 200,
    body: { linked: true, past: [], present: [], future: [] },
  }));

  await fetchMyEvents(true);

  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/me/events?refresh=true"));
});

test("fetchMyEvents: not linked resolves with linked: false", async () => {
  installFetch(() => ({
    status: 200,
    body: { linked: false, past: [], present: [], future: [] },
  }));
  const got = await fetchMyEvents();
  assert.equal(got.linked, false);
});

test("fetchMyEvents: an unexpected error status throws", async () => {
  installFetch(() => ({ status: 401, body: { error: "not signed in" } }));
  await assert.rejects(() => fetchMyEvents(), /not signed in/);
});
