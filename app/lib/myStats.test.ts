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

const { fetchMyStats } = await import("./myStats.ts");

test("fetchMyStats: sends credentials and returns the parsed body", async () => {
  const wantBody = {
    linked: true,
    totalEvents: 4,
    bestPlacing: 1,
    bestPlacingGt: 2,
    bestPlacingRtt: 1,
    bestPlacingTeams: 5,
    factions: [{ faction: "World Eaters", eventCount: 3, bestPlacing: 2 }],
    mostRecentGameSystemId: "gs-40k",
  };
  const { calls } = installFetch(() => ({ status: 200, body: wantBody }));

  const got = await fetchMyStats();

  assert.deepEqual(got, wantBody);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/me/stats"));
  assert.equal(calls[0].init?.credentials, "include");
});

test("fetchMyStats: not linked resolves with linked: false", async () => {
  installFetch(() => ({
    status: 200,
    body: { linked: false, totalEvents: 0, factions: [] },
  }));
  const got = await fetchMyStats();
  assert.equal(got.linked, false);
});

test("fetchMyStats: an unexpected error status throws", async () => {
  installFetch(() => ({ status: 401, body: { error: "not signed in" } }));
  await assert.rejects(() => fetchMyStats(), /not signed in/);
});
