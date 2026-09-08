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
 * Shared "who's signed in" state — used by the nav drawer's account
 * section and the My Events page, so both agree on the same signed-in
 * user without each running its own independent /api/me fetch-on-mount
 * (this was previously duplicated inline in AuthStatus before the nav
 * was a separate drawer from the page content).
 *
 * `checked` is false only until the very first lookup resolves — render
 * nothing (or a skeleton) until then, same as the old AuthStatus did, to
 * avoid a flash of "signed out" for someone who's actually signed in.
 * `setUser` is exposed directly so a caller that already knows the
 * result of an action (signing out, or /api/me/bcp-profile linking a
 * profile) can update local state immediately rather than waiting on
 * `refresh()` to round-trip to the backend again.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checked, setChecked] = useState(false);

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
        logClientEvent("info", "auth status check: resolved", {
          signedIn: u !== null,
          userId: u?.id,
        });
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        // Treat a failed lookup (e.g. backend unreachable) the same as
        // signed-out — this is a nice-to-have status indicator, not a
        // gate on anything actually sensitive, so there's nothing else
        // useful to do here.
        logClientEvent("warn", "auth status check: /api/me lookup failed, treating as signed out", {
          error: err instanceof Error ? err.message : String(err),
        });
        setUser(null);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setChecked(true);
      });
  }, []);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh is stable (useCallback, empty deps)
  }, []);

  return { user, checked, setUser, refresh };
}
