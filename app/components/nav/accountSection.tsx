"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { googleSignInUrl, signOut, useCurrentUser } from "../../lib/auth";
import { logClientEvent } from "../../lib/clientLog";
import ThemeToggle from "../ui/themeToggle";

/**
 * The signed-in-account bit of the nav drawer — sits at the top, above
 * the nav links (see navDrawer.tsx). Adapted from the old header
 * AuthStatus component's guts, minus the popover: there's no dropdown to
 * open/close here since the drawer itself is already the "opened" state,
 * and "My BCP events" (previously nested inside AuthStatus's dropdown)
 * is now its own page (see app/my-events/page.tsx) linked from the nav
 * list below this section rather than shown inline here.
 */
export default function AccountSection() {
  const { user, checked, setUser } = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();

  // Reserve the same height while the initial /api/me check is in
  // flight, so the drawer doesn't visibly jump once it resolves.
  if (!checked) {
    return <div className="h-[65px] border-b border-surface-border" />;
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-2 border-b border-surface-border p-3">
        <a
          href={googleSignInUrl(pathname)}
          className="flex items-center justify-center gap-2 rounded-md border border-surface-border bg-surface-2 px-3 py-2 text-sm text-text-secondary shadow-sm hover:bg-surface-1"
        >
          Sign in with Google
        </a>
        <ThemeToggle account={null} />
      </div>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    setSigningOut(true);
    logClientEvent("info", "sign-out: starting", { userId: user.id });
    try {
      await signOut();
      setUser(null);
      logClientEvent("info", "sign-out: succeeded");
      // useCurrentUser() isn't shared state — the page underneath this
      // drawer (page.tsx/calendar/my-events/stats) has its own
      // independent instance, with its own `user`, that setUser(null)
      // above never touches. Without a full reload, the page keeps
      // rendering as if still signed in (stale event data, wrong gate)
      // until something else happens to remount it. A reload is the
      // simplest fix that's actually correct everywhere this drawer can
      // be opened from, rather than wiring up real shared auth state.
      window.location.reload();
    } catch (err) {
      // Best-effort — if this failed the session cookie is presumably
      // still there server-side, so leave the UI as signed-in rather
      // than claiming a sign-out that didn't actually happen.
      logClientEvent("error", "sign-out: request failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-b border-surface-border p-3">
      <div className="flex items-center gap-2">
        {user.avatarUrl ? (
          // An arbitrary external Google avatar URL, not one of this
          // app's own static assets, so next/image's build-time
          // optimization doesn't apply without extra remote-pattern
          // config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-text-secondary">
            {initials || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text-primary">{user.name}</div>
          <div className="truncate text-xs text-text-secondary">{user.email}</div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          {signingOut ? "…" : "Sign out"}
        </button>
      </div>
      <ThemeToggle account={{ themePreference: user.themePreference }} />
    </div>
  );
}
