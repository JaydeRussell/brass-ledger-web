"use client";
import React from "react";

import HamburgerButton from "../components/nav/hamburgerButton";
import BcpProfileLinker from "../components/myEvents/bcpProfileLinker";
import PlayerStatsPanel from "../components/myEvents/playerStatsPanel";
import AccessStatusMessage from "../components/shared/accessStatusMessage";
import { useCurrentUser } from "../lib/auth";
import { useRedirectToLoginIfSignedOut } from "../lib/useRedirectToLoginIfSignedOut";

/**
 * A dedicated page for the signed-in account's player stats — moved
 * here from a compact card on /my-events (see that page's git history)
 * once there was more than a "don't overcrowd the dashboard" amount of
 * stats to show. Same sign-in / link-a-BCP-profile gating as
 * /my-events: the sign-in half is shared (see
 * useRedirectToLoginIfSignedOut), while the link-a-profile half stays
 * inline here since BcpProfileLinker's own onLinked callback needs
 * page-specific state either way.
 */
export default function StatsPage() {
  const { user, checked, setUser } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, checked);
  const [changingProfile, setChangingProfile] = React.useState(false);
  const bcpUserId = user?.bcpUserId ?? "";

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-4 pb-2 sm:pt-8">
        <HamburgerButton />
        <h1 className="font-display text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
          Player Stats
        </h1>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {!checked || !user ? null : user.status !== "approved" ? (
          <AccessStatusMessage status={user.status} />
        ) : !bcpUserId || changingProfile ? (
          <div className="rounded-lg border border-surface-border bg-surface-1 p-4">
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
                className="mt-2 text-xs text-text-secondary hover:underline"
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
                className="text-xs text-text-secondary hover:underline"
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
