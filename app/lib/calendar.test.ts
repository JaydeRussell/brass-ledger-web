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

const { fetchCalendarUrl } = await import("./calendar.ts");

test("fetchCalendarUrl: sends credentials and returns the url", async () => {
  const wantUrl = "http://localhost:8080/api/calendar/abc123.ics";
  const { calls } = installFetch(() => ({ status: 200, body: { url: wantUrl } }));

  const got = await fetchCalendarUrl();

  assert.equal(got, wantUrl);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/api/me/calendar-url"));
  assert.equal(calls[0].init?.credentials, "include");
});

test("fetchCalendarUrl: an unexpected error status throws using the backend's message", async () => {
  installFetch(() => ({ status: 401, body: { error: "not signed in" } }));
  await assert.rejects(() => fetchCalendarUrl(), /not signed in/);
});
