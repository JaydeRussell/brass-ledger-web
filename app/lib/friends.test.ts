import { test } from "node:test";
import assert from "node:assert/strict";

// Same fake-fetch-by-URL approach as follows.test.ts/myEvents.test.ts.
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

const {
  sendFriendRequest,
  fetchIncomingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  fetchFriends,
  removeFriend,
  fetchFriendEvents,
} = await import("./friends.ts");

test("sendFriendRequest: posts recipientBcpUserId with credentials", async () => {
  const { calls } = installFetch(() => ({ status: 200, body: { id: 1, status: "pending" } }));
  await sendFriendRequest("bcp-1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.credentials, "include");
  assert.deepEqual(JSON.parse(calls[0].init?.body as string), { recipientBcpUserId: "bcp-1" });
  assert.ok(calls[0].url.endsWith("/api/friends/requests"), calls[0].url);
});

test("sendFriendRequest: a non-ok response throws using the backend's error message", async () => {
  installFetch(() => ({ status: 409, body: { error: "a friend request already exists between these accounts" } }));
  await assert.rejects(() => sendFriendRequest("bcp-1"), /already exists/);
});

test("fetchIncomingFriendRequests: GETs with credentials", async () => {
  const { calls } = installFetch(() => ({
    status: 200,
    body: [{ id: 1, requesterId: 2, name: "Bea", createdAt: "2026-01-01T00:00:00Z" }],
  }));
  const got = await fetchIncomingFriendRequests();
  assert.deepEqual(got, [{ id: 1, requesterId: 2, name: "Bea", createdAt: "2026-01-01T00:00:00Z" }]);
  assert.equal(calls[0].init?.credentials, "include");
  assert.ok(calls[0].url.endsWith("/api/friends/requests"), calls[0].url);
});

test("acceptFriendRequest/declineFriendRequest: POST to the right per-id path", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));
  await acceptFriendRequest(7);
  await declineFriendRequest(8);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].url.endsWith("/api/friends/requests/7/accept"), calls[0].url);
  assert.ok(calls[1].url.endsWith("/api/friends/requests/8/decline"), calls[1].url);
  assert.equal(calls[0].init?.method, "POST");
});

test("fetchFriends: GETs with credentials", async () => {
  const { calls } = installFetch(() => ({
    status: 200,
    body: [{ userId: 2, name: "Bea", bcpUserId: "bcp-2" }],
  }));
  const got = await fetchFriends();
  assert.deepEqual(got, [{ userId: 2, name: "Bea", bcpUserId: "bcp-2" }]);
  assert.ok(calls[0].url.endsWith("/api/friends"), calls[0].url);
});

test("removeFriend: DELETEs the friend's user id", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));
  await removeFriend(2);
  assert.equal(calls[0].init?.method, "DELETE");
  assert.ok(calls[0].url.endsWith("/api/friends/2"), calls[0].url);
});

test("fetchFriendEvents: GETs the encoded bcpUserId's events path", async () => {
  const { calls } = installFetch(() => ({
    status: 200,
    body: { linked: true, past: [], present: [], future: [] },
  }));
  const got = await fetchFriendEvents("bcp 1");
  assert.deepEqual(got, { linked: true, past: [], present: [], future: [] });
  assert.ok(calls[0].url.endsWith("/api/friends/bcp%201/events"), calls[0].url);
});

test("fetchFriendEvents: a non-ok response throws", async () => {
  installFetch(() => ({ status: 404, body: { error: "not found" } }));
  await assert.rejects(() => fetchFriendEvents("bcp-1"), /not found/);
});
