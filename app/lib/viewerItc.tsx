"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from "./auth";
import { fetchItcRanking, type ItcRanking } from "./bcp";

type ViewerItcContextValue = {
  bcpUserId: string;
  rankingsByKey: Record<string, ItcRanking | null>;
  requestLeague: (leagueId: string) => void;
};

const ViewerItcContext = createContext<ViewerItcContextValue | null>(null);

// Keyed by account, not just league: a ranking cached for one signed-in
// account (or a signed-out visitor's empty "") is never looked up again
// once a different account's bcpUserId changes what key gets asked
// for — no separate "clear the cache on sign-out/sign-in" step needed.
function cacheKey(bcpUserId: string, leagueId: string): string {
  return `${bcpUserId}:${leagueId}`;
}

/**
 * Fetches the signed-in visitor's own ITC ranking — once per BCP ranking
 * league actually asked for, not once per badge — and shares it with
 * every ItcBadge on the page via context, so a ranking gradient can color
 * itself relative to "me" (see itcGradientStyle's `viewerRanking` param
 * in lib/scoreColor.ts) without each of the dozens of badges on a Roster
 * or Pairings tab independently re-fetching the exact same thing. Mounted
 * once in app/layout.tsx, same as NavProvider.
 *
 * Keyed by league because an ITC ranking only means anything within the
 * league it was computed in — a badge on one event's board might be in a
 * different league than another, so this can't just be a single
 * "the viewer's ITC ranking" value.
 */
export function ViewerItcProvider({ children }: { children: React.ReactNode }) {
  const { user, checked } = useCurrentUser();
  const bcpUserId = checked ? (user?.bcpUserId ?? "") : "";
  const [rankingsByKey, setRankingsByKey] = useState<Record<string, ItcRanking | null>>({});
  // Tracks which (account, league) pairs have already been requested (or
  // are in flight), separate from the rankingsByKey state itself so a
  // second ItcBadge asking for the same league before the first request
  // resolves doesn't fire a duplicate fetch.
  const requestedRef = useRef<Set<string>>(new Set());

  const requestLeague = useCallback(
    (leagueId: string) => {
      if (!bcpUserId || !leagueId) return;
      const key = cacheKey(bcpUserId, leagueId);
      if (requestedRef.current.has(key)) return;
      requestedRef.current.add(key);
      fetchItcRanking(bcpUserId, leagueId)
        .then((ranking) => {
          setRankingsByKey((prev) => ({ ...prev, [key]: ranking }));
        })
        .catch(() => {
          // Fails quietly (this app's own backend, but still a third-party
          // lookup underneath) — leave it unresolved rather than caching a
          // failure, so a later retry (e.g. a fresh page load) can try
          // again instead of being stuck on an error forever.
          requestedRef.current.delete(key);
        });
    },
    [bcpUserId]
  );

  const value = useMemo(
    () => ({ bcpUserId, rankingsByKey, requestLeague }),
    [bcpUserId, rankingsByKey, requestLeague]
  );

  return <ViewerItcContext.Provider value={value}>{children}</ViewerItcContext.Provider>;
}

/**
 * The signed-in visitor's own ITC ranking within `leagueId`: undefined if
 * there's no viewer to compare against (signed out, no linked BCP
 * profile, no league to ask about yet, or — outside a ViewerItcProvider
 * entirely, e.g. a plain unit-render — no provider mounted at all) or the
 * lookup just hasn't resolved yet; null once resolved as "no ranking in
 * this league." Every caller (ItcBadge) is expected to treat undefined
 * and null the same way — both mean "fall back to the absolute scale."
 */
export function useViewerItcRanking(leagueId?: string | null): ItcRanking | null | undefined {
  const ctx = useContext(ViewerItcContext);

  useEffect(() => {
    if (ctx && leagueId) ctx.requestLeague(leagueId);
  }, [ctx, leagueId]);

  if (!ctx || !ctx.bcpUserId || !leagueId) return undefined;
  return ctx.rankingsByKey[cacheKey(ctx.bcpUserId, leagueId)];
}
