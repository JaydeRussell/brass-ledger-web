import { test } from "node:test";
import assert from "node:assert/strict";

// Same fake-fetch-by-URL approach as myEvents.test.ts/recentEvents.test.ts.
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

const { followedKey, fetchFollows, addFollow, removeFollow } = await import("./follows.ts");

test("followedKey", () => {
  assert.equal(followedKey({ kind: "team", teamPlayerId: "t1", label: "Team A" }), "team:t1");
  assert.equal(followedKey({ kind: "player", playerId: "p1", label: "Player A" }), "player:p1");
});

test("fetchFollows: sends credentials, hits the per-event path, and maps the server's wire shape", async () => {
  const { calls } = installFetch(() => ({
    status: 200,
    body: [
      { kind: "team", refId: "t1", label: "Team Ultramarines" },
      { kind: "player", refId: "p1", label: "Guilliman" },
    ],
  }));

  const got = await fetchFollows("evt 1");

  assert.deepEqual(got, [
    { kind: "team", teamPlayerId: "t1", label: "Team Ultramarines" },
    { kind: "player", playerId: "p1", label: "Guilliman" },
  ]);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/me/events/evt%201/follows"), calls[0].url);
  assert.equal(calls[0].init?.credentials, "include");
});

test("fetchFollows: skips an entry with an unrecognized kind rather than crashing", async () => {
  installFetch(() => ({
    status: 200,
    body: [
      { kind: "team", refId: "t1", label: "Team A" },
      { kind: "coach", refId: "c1", label: "Coach A" },
    ],
  }));
  const got = await fetchFollows("evt-1");
  assert.deepEqual(got, [{ kind: "team", teamPlayerId: "t1", label: "Team A" }]);
});

test("fetchFollows: a non-ok response throws using the backend's error message", async () => {
  installFetch(() => ({ status: 401, body: { error: "not signed in" } }));
  await assert.rejects(() => fetchFollows("evt-1"), /not signed in/);
});

test("addFollow: posts the follow with credentials, translating the union to kind/refId", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));

  await addFollow("evt-1", { kind: "player", playerId: "p1", label: "Guilliman" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.credentials, "include");
  assert.deepEqual(JSON.parse(calls[0].init?.body as string), {
    kind: "player",
    refId: "p1",
    label: "Guilliman",
  });
});

test("addFollow: a non-ok response throws", async () => {
  installFetch(() => ({ status: 400, body: { error: "bad kind" } }));
  await assert.rejects(
    () => addFollow("evt-1", { kind: "player", playerId: "p1", label: "Guilliman" }),
    /bad kind/
  );
});

test("removeFollow: DELETEs the event/kind/refId path with credentials", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));

  await removeFollow("evt-1", { kind: "team", teamPlayerId: "t 1", label: "Team A" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, "DELETE");
  assert.equal(calls[0].init?.credentials, "include");
  assert.ok(calls[0].url.endsWith("/api/me/events/evt-1/follows/team/t%201"), calls[0].url);
});

test("removeFollow: a non-ok response throws", async () => {
  installFetch(() => ({ status: 500, body: { error: "boom" } }));
  await assert.rejects(
    () => removeFollow("evt-1", { kind: "team", teamPlayerId: "t1", label: "Team A" }),
    /boom/
  );
});
