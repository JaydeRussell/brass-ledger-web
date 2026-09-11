import { test } from "node:test";
import assert from "node:assert/strict";
import type { EventInfo } from "./bcp.ts";
import type { CachedEventSnapshot } from "./eventCache.ts";

// Same fake-Storage approach as recentEvents.test.ts — eventCache.ts
// reads window.localStorage at call time, and there's no real window (or
// jsdom) in this Node test environment. Also stubs removeItem, which
// recentEvents.ts's fake didn't need but saveCachedEvent's eviction does.
class FakeStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const fakeLocalStorage = new FakeStorage();
(globalThis as unknown as { window: { localStorage: FakeStorage } }).window = {
  localStorage: fakeLocalStorage,
};

const { loadCachedEvent, saveCachedEvent, formatRelativeTime } = await import("./eventCache.ts");

function snapshot(overrides?: Partial<EventInfo>): CachedEventSnapshot {
  const eventInfo: EventInfo = {
    id: "e1",
    name: "The Challengers Cup 2026",
    teamEvent: false,
    started: true,
    ended: false,
    currentRound: 2,
    numberOfRounds: 5,
    ...overrides,
  };
  return {
    eventInfo,
    players: [{ id: "p1", name: "Me", faction: "Orks" }],
    cachedAt: Date.now(),
  };
}

test("returns null for an event that's never been cached", () => {
  fakeLocalStorage.clear();
  assert.equal(loadCachedEvent("nope"), null);
});

test("round-trips a saved snapshot", () => {
  fakeLocalStorage.clear();
  const snap = snapshot();
  saveCachedEvent("e1", snap);
  assert.deepEqual(loadCachedEvent("e1"), snap);
});

test("overwrites a previous snapshot for the same event", () => {
  fakeLocalStorage.clear();
  saveCachedEvent("e1", snapshot({ currentRound: 1 }));
  saveCachedEvent("e1", snapshot({ currentRound: 3 }));
  assert.equal(loadCachedEvent("e1")?.eventInfo.currentRound, 3);
});

test("evicts the oldest event beyond the cap once more than 8 are cached", () => {
  fakeLocalStorage.clear();
  for (let i = 1; i <= 9; i++) {
    saveCachedEvent(`e${i}`, snapshot({ id: `e${i}` }));
  }
  // e1 was the first written and 9th-oldest once e9 pushed the count past 8.
  assert.equal(loadCachedEvent("e1"), null);
  assert.notEqual(loadCachedEvent("e9"), null);
});

test("re-saving an already-cached event doesn't cause it to be evicted early", () => {
  fakeLocalStorage.clear();
  for (let i = 1; i <= 8; i++) {
    saveCachedEvent(`e${i}`, snapshot({ id: `e${i}` }));
  }
  // e1 is refreshed, moving it back to the front of the recency order.
  saveCachedEvent("e1", snapshot({ id: "e1", currentRound: 4 }));
  saveCachedEvent("e9", snapshot({ id: "e9" }));
  // Now e2 (the actual least-recently-written) should be the one evicted, not e1.
  assert.equal(loadCachedEvent("e2"), null);
  assert.notEqual(loadCachedEvent("e1"), null);
});

test("formatRelativeTime", () => {
  const now = Date.now();
  assert.equal(formatRelativeTime(now), "just now");
  assert.equal(formatRelativeTime(now - 3 * 60 * 1000), "3 minutes ago");
  assert.equal(formatRelativeTime(now - 60 * 1000), "1 minute ago");
  assert.equal(formatRelativeTime(now - 2 * 60 * 60 * 1000), "2 hours ago");
  assert.equal(formatRelativeTime(now - 25 * 60 * 60 * 1000), "1 day ago");
});
