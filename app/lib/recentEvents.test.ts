import { test } from "node:test";
import assert from "node:assert/strict";

// recentEvents.ts reads `window.localStorage` at call time (not at import
// time), so a minimal in-memory Storage stands in for a browser here —
// there's no real window in plain Node, and jsdom isn't available in
// this environment. This only needs the two methods the module actually
// calls (getItem/setItem); anything using more of the Storage API would
// need a fuller polyfill.
class FakeStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  clear(): void {
    this.store.clear();
  }
}

const fakeLocalStorage = new FakeStorage();
(globalThis as unknown as { window: { localStorage: FakeStorage } }).window = {
  localStorage: fakeLocalStorage,
};

// Same fake-fetch-by-URL approach as myEvents.test.ts, for the two
// server-sync functions below (fetchRecentEventsFromServer/
// recordRecentEventOnServer) — the localStorage-only functions above
// never touch fetch at all.
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

const { loadRecentEvents, recordRecentEvent, fetchRecentEventsFromServer, recordRecentEventOnServer } =
  await import("./recentEvents.ts");
type RecentEvent = Awaited<ReturnType<typeof loadRecentEvents>>[number];

function reset() {
  fakeLocalStorage.clear();
}

// Table-driven: every branch of loadRecentEvents' defensive parsing —
// nothing stored, garbage JSON, valid-but-wrong-shaped JSON, and a
// genuinely valid list. Each of these is a "does this input come back as
// this concrete list" case, so a single table covers the function.
test("loadRecentEvents", () => {
  const cases: { name: string; stored: string | null; want: unknown[] }[] = [
    { name: "nothing stored yet returns an empty list", stored: null, want: [] },
    { name: "unparseable JSON returns an empty list rather than throwing", stored: "{not json", want: [] },
    { name: "valid JSON that isn't an array returns an empty list", stored: JSON.stringify({ not: "an array" }), want: [] },
    {
      name: "a valid stored array is returned as-is",
      stored: JSON.stringify([{ id: "e1", name: "Event One", teamEvent: false, lastViewedAt: 123 }]),
      want: [{ id: "e1", name: "Event One", teamEvent: false, lastViewedAt: 123 }],
    },
  ];

  for (const tc of cases) {
    reset();
    if (tc.stored !== null) fakeLocalStorage.setItem("bcp-recent-events", tc.stored);
    const got = loadRecentEvents();
    assert.deepEqual(got, tc.want, `${tc.name}: got ${JSON.stringify(got)}`);
  }
});

// Table-driven: recordRecentEvent's list-management rules — moves an
// event to the front, dedupes by id, and caps the list length — each
// expressed as a starting list + an event to record + the expected
// resulting id order.
test("recordRecentEvent", () => {
  const makeEvent = (id: string): RecentEvent => ({ id, name: id, teamEvent: false, lastViewedAt: 0 });

  const cases: {
    name: string;
    current: RecentEvent[];
    record: { id: string; name: string; teamEvent: boolean };
    wantIdOrder: string[];
  }[] = [
    {
      name: "adding to an empty list",
      current: [],
      record: { id: "e1", name: "Event One", teamEvent: false },
      wantIdOrder: ["e1"],
    },
    {
      name: "a new event goes to the front, ahead of existing ones",
      current: [makeEvent("e1"), makeEvent("e2")],
      record: { id: "e3", name: "Event Three", teamEvent: true },
      wantIdOrder: ["e3", "e1", "e2"],
    },
    {
      name: "re-viewing an existing event dedupes it and moves it to the front",
      current: [makeEvent("e1"), makeEvent("e2"), makeEvent("e3")],
      record: { id: "e2", name: "Event Two", teamEvent: false },
      wantIdOrder: ["e2", "e1", "e3"],
    },
    {
      name: "the list is capped at 8 entries, dropping the oldest",
      current: [
        makeEvent("e1"), makeEvent("e2"), makeEvent("e3"), makeEvent("e4"),
        makeEvent("e5"), makeEvent("e6"), makeEvent("e7"), makeEvent("e8"),
      ],
      record: { id: "e9", name: "Event Nine", teamEvent: false },
      wantIdOrder: ["e9", "e1", "e2", "e3", "e4", "e5", "e6", "e7"],
    },
  ];

  for (const tc of cases) {
    reset();
    const result = recordRecentEvent(tc.current, tc.record);
    const gotIdOrder = result.map((e) => e.id);
    assert.deepEqual(gotIdOrder, tc.wantIdOrder, `${tc.name}: got order ${JSON.stringify(gotIdOrder)}`);
    assert.ok(result.length <= 8, `${tc.name}: result has ${result.length} entries, want at most 8`);
  }
});

test("recordRecentEvent persists the updated list so a later load sees it", () => {
  reset();
  recordRecentEvent([], { id: "e1", name: "Event One", teamEvent: false });
  const reloaded = loadRecentEvents();
  assert.equal(reloaded.length, 1);
  assert.equal(reloaded[0].id, "e1");
});

test("recordRecentEvent stamps the recorded event with a fresh lastViewedAt", () => {
  reset();
  const before = Date.now();
  const [recorded] = recordRecentEvent([], { id: "e1", name: "Event One", teamEvent: false });
  const after = Date.now();
  assert.ok(
    recorded.lastViewedAt >= before && recorded.lastViewedAt <= after,
    `lastViewedAt ${recorded.lastViewedAt} wasn't between ${before} and ${after}`
  );
});

test("fetchRecentEventsFromServer: sends credentials and maps the server's wire shape", async () => {
  const { calls } = installFetch(() => ({
    status: 200,
    body: [{ eventId: "e1", eventName: "Event One", teamEvent: true, lastViewedAt: 123 }],
  }));

  const got = await fetchRecentEventsFromServer();

  assert.deepEqual(got, [{ id: "e1", name: "Event One", teamEvent: true, lastViewedAt: 123 }]);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/me/recent-events"));
  assert.equal(calls[0].init?.credentials, "include");
});

test("fetchRecentEventsFromServer: a non-ok response throws using the backend's error message", async () => {
  installFetch(() => ({ status: 401, body: { error: "not signed in" } }));
  await assert.rejects(() => fetchRecentEventsFromServer(), /not signed in/);
});

test("recordRecentEventOnServer: posts the event with credentials", async () => {
  const { calls } = installFetch(() => ({ status: 204 }));

  await recordRecentEventOnServer({ id: "e1", name: "Event One", teamEvent: false });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(calls[0].init?.credentials, "include");
  assert.deepEqual(JSON.parse(calls[0].init?.body as string), {
    eventId: "e1",
    eventName: "Event One",
    teamEvent: false,
  });
});

test("recordRecentEventOnServer: a non-ok response throws", async () => {
  installFetch(() => ({ status: 500, body: { error: "boom" } }));
  await assert.rejects(() => recordRecentEventOnServer({ id: "e1", name: "Event One", teamEvent: false }), /boom/);
});
