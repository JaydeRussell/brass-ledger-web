"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { googleSignInUrl, signOut, useCurrentUser } from "../../lib/auth";
import { logClientEvent } from "../../lib/clientLog";

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
    return <div className="h-[65px] border-b border-zinc-100 dark:border-zinc-800" />;
  }

  if (!user) {
    return (
      <div className="border-b border-zinc-100 p-3 dark:border-zinc-800">
        <a
          href={googleSignInUrl(pathname)}
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Sign in with Google
        </a>
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
    <div className="border-b border-zinc-100 p-3 dark:border-zinc-800">
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {initials || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{user.name}</div>
          <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {signingOut ? "…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
