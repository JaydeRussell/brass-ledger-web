"use client";
import React from "react";

import BcpProfileLinker from "../components/myEvents/bcpProfileLinker";
import PlayerStatsPanel from "../components/myEvents/playerStatsPanel";
import AccessStatusMessage from "../components/shared/accessStatusMessage";
import Card from "../components/ui/card";
import PageHeader from "../components/layout/pageHeader";
import PageMain from "../components/layout/pageMain";
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
    <div className="flex-1 bg-surface-0">
      <PageHeader title="Player Stats" />

      <PageMain>
        {!checked || !user ? null : user.status !== "approved" ? (
          <AccessStatusMessage status={user.status} />
        ) : !bcpUserId || changingProfile ? (
          <Card className="p-4">
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
          </Card>
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
      </PageMain>
    </div>
  );
}
