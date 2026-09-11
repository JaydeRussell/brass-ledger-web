"use client";
import React, { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

import PlayerStatsPanel from "../../components/myEvents/playerStatsPanel";
import AccessStatusMessage from "../../components/shared/accessStatusMessage";
import PageHeader from "../../components/layout/pageHeader";
import PageMain from "../../components/layout/pageMain";
import { useCurrentUser } from "../../lib/auth";
import { useRedirectToLoginIfSignedOut } from "../../lib/useRedirectToLoginIfSignedOut";

/**
 * A read-only player-stats page for an arbitrary player, reached by
 * clicking their name wherever it already carries a BCP account id
 * elsewhere in the app — the Roster tab's player cards, the Pairings
 * tab's round board / my-pairings entries, the Placings tab's individual
 * standings. Unlike /stats (the signed-in account's own version of this
 * same summary), there's no "link your profile" flow here: the bcpUserId
 * in the URL is already known, not something this page has to resolve.
 *
 * `?name=` is a one-shot display hint carried from wherever the click
 * came from (a page/table row already has the player's name in hand) —
 * used for the page title and PlayerStatsPanel's copy, never fetched or
 * relied on for correctness. A direct visit with no `?name=` still
 * works; it just falls back to a generic title.
 */
function PlayerStatsContent() {
  const params = useParams<{ bcpUserId: string }>();
  const searchParams = useSearchParams();
  const bcpUserId = params.bcpUserId;
  const name = searchParams.get("name") || undefined;

  const { user, checked } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, checked);

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title={name ?? "Player Stats"} />

      <PageMain>
        {!checked || !user ? null : user.status !== "approved" ? (
          <AccessStatusMessage status={user.status} />
        ) : (
          <PlayerStatsPanel bcpUserId={bcpUserId} mode="player" playerName={name} />
        )}
      </PageMain>
    </div>
  );
}

// Same Suspense-boundary requirement as app/page.tsx and
// app/my-events/page.tsx, for the same reason: useSearchParams needs one
// above it under Next's app router.
export default function PlayerStatsPage() {
  return (
    <Suspense fallback={null}>
      <PlayerStatsContent />
    </Suspense>
  );
}
