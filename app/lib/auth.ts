// Client for this app's own backend's Google sign-in endpoints
// (see internal/api/auth.go in the brass-ledger-api repo).
//
// Session state lives in an httpOnly cookie the backend sets on
// successful sign-in — every request here needs `credentials: "include"`
// so the browser actually sends/receives it, unlike the plain
// unauthenticated reads in bcp.ts (which don't need cookies at all). The
// backend's CORS config only allows this from the configured frontend
// origin (see the backend's FRONTEND_BASE_URL), so this won't work
// against a backend running for a different origin.

import { useCallback, useEffect, useRef, useState } from "react";
import { logClientEvent } from "./clientLog.ts";

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  avatarUrl: string;
  // "" if this account hasn't linked a Best Coast Pairings profile yet
  // (see app/lib/myEvents.ts's linkBcpProfile).
  bcpUserId: string;
  // "user" or "admin" — see the backend's internal/user.Role* constants
  // (migration 0007). Only meaningfully used by the admin panel today.
  role: "user" | "admin";
  // "pending", "approved", or "rejected" (internal/user.Status*,
  // migration 0007). A valid session alone gets you this far (you can
  // always see your own /api/me), but every real feature — the BCP
  // proxy, My Events, Stats, follows sync — needs "approved" on the
  // backend too (see api.RequireApproved), so the frontend gates its
  // own content the same way rather than showing a broken page that
  // 403s on every fetch. See app/components/shared/accessStatusMessage.tsx,
  // the shared "you're signed in but not approved yet" UI every gated
  // page shows for anything other than "approved".
  status: "pending" | "approved" | "rejected";
  // "light", "dark", or "system" (internal/user.Theme*, migration 0008)
  // — the account-level counterpart to app/lib/theme.ts's localStorage
  // fallback for a signed-out guest. See useTheme()'s `account` param.
  themePreference: "light" | "dark" | "system";
};

/**
 * The URL to send the browser to in order to start Google sign-in.
 * Intentionally a URL, not a fetch: the caller does a plain top-level
 * navigation (e.g. `window.location.href = googleSignInUrl()`) — the
 * backend redirects to Google, Google redirects back to the backend's
 * own callback, and the backend redirects the browser to this app.
 *
 * `returnTo` (typically `usePathname()` at the call site) is where a
 * *returning, already-linked* account lands back after signing in —
 * e.g. signing back in from /stats returns you to /stats instead of
 * always the homepage. Ignored server-side for an account that's never
 * linked a BCP profile, which always goes through /welcome first
 * regardless — see internal/api/auth.go's callback for why.
 */
export function googleSignInUrl(returnTo?: string): string {
  const url = `${BACKEND_API_BASE}/auth/google/login`;
  if (!returnTo) return url;
  return `${url}?return_to=${encodeURIComponent(returnTo)}`;
}

/**
 * Fetches the currently signed-in user, or null if nobody's signed in.
 * A 401 is the expected, normal response for a signed-out visitor (not
 * an error) — every other non-ok response throws.
 */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch(`${BACKEND_API_BASE}/api/me`, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`Request failed: HTTP ${res.status}`);
  }
  return (await res.json()) as CurrentUser;
}

/** Clears the session server-side and asks the browser to drop the cookie. */
export async function signOut(): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Sign-out failed: HTTP ${res.status}`);
  }
}

/**
 * The reusable "who's signed in" hook — the same shape/logic used by
 * the nav drawer's account section and every gated page (root event
 * viewer, /calendar, /my-events, /stats), instead of each duplicating
 * its own /api/me fetch-on-mount inline (this was literally duplicated
 * in AuthStatus before the nav was a separate drawer from the page
 * content).
 *
 * NOT shared state, despite living in one place: every call site gets
 * its own independent `user`/`checked`, each with its own /api/me
 * fetch-on-mount — the nav drawer's instance and a page's instance
 * don't know about each other. That's why signing out
 * (accountSection.tsx's handleSignOut) forces a full page reload after
 * `setUser(null)` rather than trusting that call alone to update
 * what's rendered underneath the drawer.
 *
 * `checked` is false only until the very first lookup resolves — render
 * nothing (or a skeleton) until then, same as the old AuthStatus did, to
 * avoid a flash of "signed out" for someone who's actually signed in.
 * `setUser` is exposed directly so a caller that already knows the
 * result of an action (signing out, or /api/me/bcp-profile linking a
 * profile) can update its own local state immediately rather than
 * waiting on `refresh()` to round-trip to the backend again.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checked, setChecked] = useState(false);
  // True only when the /api/me lookup itself failed (network error, 5xx —
  // fetchCurrentUser throws for anything but a clean 401), as opposed to
  // a confirmed 401 (fetchCurrentUser resolves that to `null` normally).
  // Both leave `user` null, but a caller that can fall back to
  // already-cached content on a bad connection (see app/page.tsx's
  // eventCache.ts-backed fallback) needs to tell the two apart — a real
  // 401 means sign in again; a failed lookup means "unknown, don't
  // navigate away from what's already on screen."
  const [authError, setAuthError] = useState(false);

  // Guards against a stale lookup clobbering fresher state — e.g. the
  // mount effect's own lookup resolving after a caller has already
  // invoked `refresh()` again (or after unmount), rather than a plain
  // boolean "cancelled" flag that only handles a single overlap.
  const requestIdRef = useRef(0);

  const refresh = useCallback(() => {
    const requestId = ++requestIdRef.current;
    logClientEvent("info", "auth status check: starting /api/me lookup");
    return fetchCurrentUser()
      .then((u) => {
        if (requestIdRef.current !== requestId) return;
        setUser(u);
        setAuthError(false);
        logClientEvent("info", "auth status check: resolved", {
          signedIn: u !== null,
          userId: u?.id,
        });
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        // `user` still goes null here (nothing confirms a session), but
        // authError distinguishes this from a real 401 — see its
        // declaration above. A caller with no fallback of its own can
        // keep treating this exactly like signed-out, same as before.
        logClientEvent("warn", "auth status check: /api/me lookup failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        setUser(null);
        setAuthError(true);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setChecked(true);
      });
  }, []);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh is stable (useCallback, empty deps)
  }, []);

  return { user, checked, authError, setUser, refresh };
}
