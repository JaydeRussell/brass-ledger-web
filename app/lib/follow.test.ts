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

test("searchEvents encodes the query", async () => {
  const calls = installFetch(() => ({ status: 200, body: [] }));
  await searchEvents("  Lone Star & Co ");
  assert.match(calls[0].url, /\/api\/event-search\?q=Lone%20Star%20%26%20Co$/);
});
