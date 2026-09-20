"use client";
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

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { logClientEvent } from "./clientLog.ts";
import type { AccentTheme } from "./theme.ts";

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
  // One of AccentTheme's 12 values (internal/user.ValidAccentThemes,
  // migration 0009) — the account-level counterpart to useAccentTheme()'s
  // localStorage fallback for a signed-out guest.
  accentTheme: AccentTheme;
  // Whether this account's player dossier (migration 0014) is reachable
  // by anyone at /players/[bcpUserId] — see app/lib/dossier.ts and
  // components/myEvents/dossierVisibilityToggle.tsx, the only place this
  // is changed. Defaults to true (visible) for every account.
  dossierPublic: boolean;
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

export type CurrentUserState = {
  user: CurrentUser | null;
  checked: boolean;
  authError: boolean;
  setUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  refresh: () => Promise<void>;
};

const CurrentUserContext = createContext<CurrentUserState | null>(null);

/**
 * Owns the single /api/me lookup for the whole page. Mounted once in
 * app/layout.tsx, outside every other provider that needs to know who's
 * signed in (ViewerItcProvider), so there is exactly one lookup per page
 * load rather than one per consumer.
 *
 * This used to be per-caller state — every consumer (the nav drawer, the
 * command palette, the feedback widget, ViewerItcProvider, and the routed
 * page) ran its own fetch-on-mount, so a single page load fired six
 * identical /api/me requests and twelve /api/log writes. Sharing also
 * removes the reason accountSection.tsx had to force a full page reload
 * after sign-out, and the reason linking a BCP profile left the drawer's
 * copy of `bcpUserId` stale.
 */
export function CurrentUserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  /**
   * What the server already worked out about this visitor, if anything.
   *
   * Three states, and the distinction between two of them is the whole
   * point:
   *
   *   - a user   — signed in, confirmed server-side. Render with it.
   *   - `null`   — confirmed signed out (no session cookie, or the
   *                backend said 401). Also final; don't ask again.
   *   - `undefined` — the server couldn't tell, because the lookup
   *                failed or this render had no request to read. Fall
   *                back to asking from the client, exactly as before.
   *
   * Collapsing `null` and `undefined` would mean either re-fetching for
   * every signed-out visitor (pointless) or trusting a failed lookup as
   * a confirmed sign-out (wrong, and it would bounce people to /login).
   */
  initialUser?: CurrentUser | null;
}) {
  const [user, setUser] = useState<CurrentUser | null>(initialUser ?? null);
  // `checked` means "we know the answer". The server knowing counts.
  const [checked, setChecked] = useState(initialUser !== undefined);
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
    // Skipped when the server already answered. That request is the
    // reason every gated page used to wait before it could show
    // anything: nothing could decide whether to fetch its own data
    // until this resolved, so the page sat through a full round trip
    // before starting the one that mattered.
    if (initialUser !== undefined) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh is stable (useCallback, empty deps); initialUser is a per-render constant from the server
  }, []);

  const value = useMemo<CurrentUserState>(
    () => ({ user, checked, authError, setUser, refresh }),
    [user, checked, authError, refresh]
  );

  return React.createElement(CurrentUserContext.Provider, { value }, children);
}

// What a consumer rendered outside any CurrentUserProvider sees: the same
// "nobody's signed in, and we haven't checked yet" state every consumer
// already handles as its own first render. Deliberately a fallback rather
// than a throw (unlike useNav), because this project's DOM-free tests
// render providers like ViewerItcProvider in isolation and assert exactly
// this pre-check state — see app/lib/viewerItc.test.ts. A module-level
// constant so its identity is stable across renders.
const NO_PROVIDER_STATE: CurrentUserState = {
  user: null,
  checked: false,
  authError: false,
  setUser: () => {},
  refresh: async () => {},
};

/**
 * The reusable "who's signed in" hook — the same shape used by the nav
 * drawer's account section and every gated page (root event viewer,
 * /calendar, /my-events, /stats).
 *
 * Shared state: every consumer reads the one CurrentUserProvider mounted
 * in app/layout.tsx, so `setUser` from any of them (sign-out, or
 * /api/me/bcp-profile linking a profile) is immediately visible to all
 * the others.
 *
 * `checked` is false only until the very first lookup resolves — render
 * nothing (or a skeleton) until then, to avoid a flash of "signed out"
 * for someone who's actually signed in. `setUser` is exposed directly so
 * a caller that already knows the result of an action can apply it
 * without waiting on `refresh()` to round-trip to the backend again.
 */
export function useCurrentUser(): CurrentUserState {
  const ctx = useContext(CurrentUserContext);
  if (ctx) return ctx;

  // Warns on every render rather than once — a module-level "already
  // warned" flag would be a render-time global mutation, which the React
  // Compiler lint (react-hooks/globals) rejects, and this should be loud
  // anyway: in the real app the provider is always mounted in
  // app/layout.tsx, so reaching here at all is a wiring mistake.
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "useCurrentUser() was called outside a CurrentUserProvider — treating the visitor as signed-out and unchecked. Mount CurrentUserProvider in app/layout.tsx."
    );
  }
  return NO_PROVIDER_STATE;
}
