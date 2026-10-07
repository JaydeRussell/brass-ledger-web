import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const { fetchRoundNote, saveRoundNote, __clearRoundNotesForTests } = await import("./roundNotes.ts");

let calls: string[] = [];
function installFetch(respond: (url: string, init?: RequestInit) => { status: number; body: string }) {
  calls = [];
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${url}`);
    const { status, body } = respond(url, init);
    return { ok: status >= 200 && status < 300, status, text: async () => body } as Response;
  }) as typeof fetch;
}

beforeEach(() => __clearRoundNotesForTests());

test("a round's note is fetched once however many times the box mounts", async () => {
  installFetch(() => ({ status: 200, body: JSON.stringify({ note: "Screen the left flank" }) }));
  assert.equal(await fetchRoundNote("evt-1", 3), "Screen the left flank");
  assert.equal(await fetchRoundNote("evt-1", 3), "Screen the left flank");
  assert.equal(calls.length, 1);
});

test("saving updates what the next read returns, without a request", async () => {
  installFetch(() => ({ status: 200, body: "" }));
  await saveRoundNote("evt-1", 4, "  Deploy deep  ");
  assert.equal(await fetchRoundNote("evt-1", 4), "  Deploy deep  ");
  await saveRoundNote("evt-1", 4, "   ");
  assert.equal(await fetchRoundNote("evt-1", 4), "", "a blank note is deleted, as on the server");
  assert.deepEqual(calls.map((c) => c.split(" ")[0]), ["PUT", "PUT"]);
});

test("a failed read is retried on the next mount", async () => {
  installFetch(() => ({ status: 500, body: "" }));
  await assert.rejects(fetchRoundNote("evt-1", 5));
  installFetch(() => ({ status: 200, body: JSON.stringify({ note: "" }) }));
  assert.equal(await fetchRoundNote("evt-1", 5), "");
  assert.equal(calls.length, 1);
});
