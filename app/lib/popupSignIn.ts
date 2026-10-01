/**
 * Google sign-in for the app when it's installed to an iPhone's home
 * screen.
 *
 * The normal flow (a top-level navigation to googleSignInUrl) can't work
 * there. An installed iOS web app keeps its own cookies, separate from
 * Safari, and any navigation that leaves the app's own origin — to
 * api.brass-ledger.app, then Google — opens in an in-app Safari View
 * Controller that keeps a *third* set of cookies. The backend's callback
 * sets the session cookie in that overlay, so sign-in "succeeds" and the
 * installed app stays signed out.
 *
 * A window opened with `window.open` does stay inside the home-screen
 * app and shares its storage (Apple, WWDC23 "What's new in web apps"),
 * so on an installed iPhone the sign-in link opens a popup instead. The
 * popup goes through the unchanged backend flow and lands back on this
 * app; PopupSignInBridge, mounted on every page, notices it's the popup
 * finishing a sign-in, tells the app where sign-in landed, and closes.
 *
 * `window.opener` can't carry that message: Google's pages send
 * Cross-Origin-Opener-Policy, which severs the popup from its opener
 * partway through. A same-origin BroadcastChannel isn't affected.
 *
 * Android and desktop browsers don't need any of this — an installed
 * app there shares the browser's cookies — so they keep the plain
 * navigation. Stores no user data: a timestamp and a per-tab flag only.
 */

export const SIGN_IN_CHANNEL = "brassLedger.popupSignIn";

// localStorage, shared with the popup: "a popup sign-in was started at
// <ms>". The first page to load without OPENER_KEY while this is fresh
// is the popup arriving back.
export const PENDING_KEY = "popupSignInStartedAt";

// sessionStorage, per window: marks the window that opened the popup, so
// its own page loads never mistake themselves for the popup.
export const OPENER_KEY = "popupSignInOpener";

// Matches the backend's 10-minute oauth_state cookie: a sign-in older
// than this can't complete anyway.
export const PENDING_TTL_MS = 10 * 60 * 1000;

export type SignInCompleteMessage = { type: "signed-in"; path: string };

/** True only in a web app launched from an iPhone/iPad home screen. */
export function isIosStandalone(nav: Navigator): boolean {
  return (nav as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Click handler for a sign-in link. Leaves the click alone (a normal
 * navigation to the link's href) everywhere except an installed iPhone
 * app, where it opens the same URL in a popup instead. Falls back to the
 * normal navigation if the popup is refused.
 */
export function handleSignInClick(event: { preventDefault(): void }, url: string): void {
  if (typeof window === "undefined" || !isIosStandalone(window.navigator)) return;
  try {
    window.localStorage.setItem(PENDING_KEY, String(Date.now()));
    window.sessionStorage.setItem(OPENER_KEY, "1");
  } catch {
    return; // storage unavailable — the popup couldn't report back
  }
  // Must run synchronously inside the tap, or it's blocked as a popup.
  if (window.open(url, "_blank")) event.preventDefault();
}

/**
 * Called once per page load. If this window is a popup arriving back
 * from a sign-in, consumes the pending marker and returns the path it
 * landed on; otherwise null.
 */
export function consumePendingSignIn(
  local: Pick<Storage, "getItem" | "removeItem">,
  session: Pick<Storage, "getItem">,
  now: number,
  path: string,
): string | null {
  if (session.getItem(OPENER_KEY)) return null;
  const startedAt = Number(local.getItem(PENDING_KEY));
  if (!startedAt) return null;
  local.removeItem(PENDING_KEY);
  if (now - startedAt > PENDING_TTL_MS) return null;
  return path;
}
