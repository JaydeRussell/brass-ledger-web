"use client";
import React from "react";

import HamburgerButton from "../components/nav/hamburgerButton";
import BcpProfileLinker from "../components/myEvents/bcpProfileLinker";
import PlayerStatsPanel from "../components/myEvents/playerStatsPanel";
import { googleSignInUrl, useCurrentUser } from "../lib/auth";

/**
 * A dedicated page for the signed-in account's player stats — moved
 * here from a compact card on /my-events (see that page's git history)
 * once there was more than a "don't overcrowd the dashboard" amount of
 * stats to show. Same sign-in / link-a-BCP-profile gating as
 * /my-events, duplicated rather than shared: each page's gating is
 * small and this project's existing convention (myEvents.ts, follows.ts,
 * recentEvents.ts) already favors a little duplication over a shared
 * abstraction for logic this size.
 */
export default function StatsPage() {
  const { user, checked, setUser } = useCurrentUser();
  const [changingProfile, setChangingProfile] = React.useState(false);
  const bcpUserId = user?.bcpUserId ?? "";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-4 pb-2 sm:pt-8">
        <HamburgerButton />
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
          Player Stats
        </h1>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {!checked ? null : !user ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <p className="mb-3">Sign in to see your player stats.</p>
            <a
              href={googleSignInUrl()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign in with Google
            </a>
          </div>
        ) : !bcpUserId || changingProfile ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <BcpProfileLinker
              onLinked={(id) => {
                setUser((prev) => (prev ? { ...prev, bcpUserId: id } : prev));
                setChangingProfile(false);
              }}
            />
            {bcpUserId && changingProfile && (
              <button
                type="button"
                onClick={() => setChangingProfile(false)}
                className="mt-2 text-xs text-zinc-500 hover:underline dark:text-zinc-400"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setChangingProfile(true)}
                className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
              >
                Change profile
              </button>
            </div>
            <PlayerStatsPanel bcpUserId={bcpUserId} />
          </>
        )}
      </main>
    </div>
  );
}
