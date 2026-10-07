import { test } from "node:test";
import assert from "node:assert/strict";

type Call = { url: string; init?: RequestInit };

function installFetch(handler: (url: string, init?: RequestInit) => { status: number; body?: unknown }): Call[] {
  const calls: Call[] = [];
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const { status, body } = handler(url, init);
    const text = body === undefined ? "" : JSON.stringify(body);
    return { ok: status >= 200 && status < 300, status, text: async () => text } as Response;
  }) as typeof fetch;
  return calls;
}

const {
  createFollowLink,
  fetchMyFollowLink,
  fetchSpectatingFor,
  resolveFollowLink,
  saveSpectating,
  searchEvents,
  FollowRequestError,
} = await import("./follow.ts");

test("lookups answer null on a 404 and throw on anything else", async () => {
  installFetch(() => ({ status: 404, body: { error: "not found" } }));
  assert.equal(await resolveFollowLink("tok"), null);
  assert.equal(await fetchMyFollowLink("evt-1"), null);
  assert.equal(await fetchSpectatingFor("evt-1"), null);

  installFetch(() => ({ status: 500, body: { error: "boom" } }));
  await assert.rejects(resolveFollowLink("tok"), (err: unknown) => err instanceof FollowRequestError && err.status === 500);
});

test("createFollowLink sends a credentialed PUT", async () => {
  const calls = installFetch(() => ({ status: 200, body: { token: "t", expiresAt: "2026-10-18T00:00:00Z" } }));
  const link = await createFollowLink("evt 1");
  assert.equal(link.token, "t");
  assert.match(calls[0].url, /\/api\/events\/evt%201\/follow-link$/);
  assert.equal(calls[0].init?.method, "PUT");
  assert.equal(calls[0].init?.credentials, "include");
});

test("saveSpectating posts the link token or the picked player", async () => {
  const calls = installFetch(() => ({ status: 200, body: { saved: true } }));
  await saveSpectating({ token: "tok" });
  await saveSpectating({ eventId: "evt-1", playerId: "p2" });
  assert.equal(calls[0].init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { token: "tok" });
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), { eventId: "evt-1", playerId: "p2" });
});

test("searchEvents encodes the query, passes the cursor, and accepts an unpaged list", async () => {
  const calls = installFetch(() => ({ status: 200, body: { results: [], nextCursor: "c2" } }));
  const page = await searchEvents("  Lone Star & Co ");
  assert.match(calls[0].url, /\/api\/event-search\?q=Lone\+Star\+%26\+Co$/);
  assert.equal(page.nextCursor, "c2");
  await searchEvents("open", "c2");
  assert.match(calls[1].url, /q=open&cursor=c2$/);

  installFetch(() => ({ status: 200, body: [{ id: "e1", name: "Open", teamEvent: false, started: false, ended: false }] }));
  const legacy = await searchEvents("open");
  assert.equal(legacy.results.length, 1);
  assert.equal(legacy.nextCursor, undefined);
});

test("eventStatus: upcoming, underway or finished", async () => {
  const { eventStatus } = await import("./follow.ts");
  assert.equal(eventStatus({ started: false, ended: false }), "Upcoming");
  assert.equal(eventStatus({ started: true, ended: false }), "Underway");
  assert.equal(eventStatus({ started: true, ended: true }), "Finished");
});

test("eventStatus: a past event BCP never started is Not started, not Upcoming", async () => {
  const { eventStatus } = await import("./follow.ts");
  const now = new Date("2026-10-06T12:00:00");
  assert.equal(eventStatus({ started: false, ended: false, startDate: "2026-10-02" }, now), "Not started");
  assert.equal(eventStatus({ started: false, ended: false, startDate: "2026-10-06" }, now), "Upcoming", "today still counts");
  assert.equal(eventStatus({ started: false, ended: false, startDate: "2026-10-05", endDate: "2026-10-07" }, now), "Upcoming");
  assert.equal(eventStatus({ started: false, ended: false }, now), "Upcoming", "no dates");
});
