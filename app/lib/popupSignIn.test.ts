import { test } from "node:test";
import assert from "node:assert/strict";
import {
  OPENER_KEY,
  PENDING_KEY,
  PENDING_TTL_MS,
  consumePendingSignIn,
  handleSignInClick,
  isIosStandalone,
} from "./popupSignIn.ts";

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
}

const NOW = 1_800_000_000_000;

test("isIosStandalone is true only for navigator.standalone === true", () => {
  assert.equal(isIosStandalone({ standalone: true } as unknown as Navigator), true);
  assert.equal(isIosStandalone({ standalone: false } as unknown as Navigator), false);
  // Android/desktop browsers don't have the property at all.
  assert.equal(isIosStandalone({} as Navigator), false);
});

test("a page loaded while a sign-in is pending is the popup arriving back", () => {
  const local = new FakeStorage();
  local.setItem(PENDING_KEY, String(NOW - 30_000));
  assert.equal(consumePendingSignIn(local, new FakeStorage(), NOW, "/welcome"), "/welcome");
  // Consumed: a second load (or a later relaunch) doesn't fire again.
  assert.equal(local.getItem(PENDING_KEY), null);
  assert.equal(consumePendingSignIn(local, new FakeStorage(), NOW, "/welcome"), null);
});

test("the window that opened the popup never treats its own loads as the popup", () => {
  const local = new FakeStorage();
  local.setItem(PENDING_KEY, String(NOW - 30_000));
  const session = new FakeStorage();
  session.setItem(OPENER_KEY, "1");
  assert.equal(consumePendingSignIn(local, session, NOW, "/stats"), null);
  // Left in place for the popup to consume.
  assert.equal(local.getItem(PENDING_KEY), String(NOW - 30_000));
});

test("nothing pending means an ordinary page load", () => {
  assert.equal(consumePendingSignIn(new FakeStorage(), new FakeStorage(), NOW, "/"), null);
});

test("a stale pending sign-in is cleared without reporting", () => {
  const local = new FakeStorage();
  local.setItem(PENDING_KEY, String(NOW - PENDING_TTL_MS - 1));
  assert.equal(consumePendingSignIn(local, new FakeStorage(), NOW, "/"), null);
  assert.equal(local.getItem(PENDING_KEY), null);
});

function withWindow(win: object, fn: () => void) {
  const g = globalThis as unknown as { window?: object };
  const prev = g.window;
  g.window = win;
  try {
    fn();
  } finally {
    g.window = prev;
  }
}

test("outside an installed iPhone app, the click is a normal navigation", () => {
  let opened = false;
  let prevented = false;
  withWindow(
    {
      navigator: {},
      localStorage: new FakeStorage(),
      sessionStorage: new FakeStorage(),
      open: () => ((opened = true), {}),
    },
    () => handleSignInClick({ preventDefault: () => (prevented = true) }, "https://api.example/login"),
  );
  assert.equal(opened, false);
  assert.equal(prevented, false);
});

test("in an installed iPhone app, the click opens a popup and marks both ends", () => {
  const local = new FakeStorage();
  const session = new FakeStorage();
  let openedUrl: string | undefined;
  let prevented = false;
  withWindow(
    {
      navigator: { standalone: true },
      localStorage: local,
      sessionStorage: session,
      open: (url: string) => ((openedUrl = url), {}),
    },
    () => handleSignInClick({ preventDefault: () => (prevented = true) }, "https://api.example/login"),
  );
  assert.equal(openedUrl, "https://api.example/login");
  assert.equal(prevented, true);
  assert.ok(local.getItem(PENDING_KEY));
  assert.equal(session.getItem(OPENER_KEY), "1");
});

test("a refused popup falls back to the normal navigation", () => {
  let prevented = false;
  withWindow(
    {
      navigator: { standalone: true },
      localStorage: new FakeStorage(),
      sessionStorage: new FakeStorage(),
      open: () => null,
    },
    () => handleSignInClick({ preventDefault: () => (prevented = true) }, "https://api.example/login"),
  );
  assert.equal(prevented, false);
});
