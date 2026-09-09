"use client";
import React, { useEffect, useMemo, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import TeamRoster from "./components/roster/roster";
import PlayerCard from "./components/roster/playerCard";
import EventSettings from "./components/settings/eventSettings";
import MyPairings from "./components/pairings/myPairings";
import RoundBoard from "./components/pairings/roundBoard";
import PlacingsTable from "./components/placings/placingsTable";
import OverviewPanel from "./components/overview/overviewPanel";
import TabBar, { type TabKey } from "./components/tabs/tabBar";
import FollowingPill from "./components/tabs/followingPill";
import HamburgerButton from "./components/nav/hamburgerButton";
import SearchBar from "./components/search/searchBar";
import AccessStatusMessage from "./components/shared/accessStatusMessage";
import { useRedirectToLoginIfSignedOut } from "./lib/useRedirectToLoginIfSignedOut";
import {
  fetchBcpEventInfo,
  fetchBcpPlayers,
  fetchBcpPlacings,
  fetchCurrentItcLeagueId,
  fetchItcRanking,
  fetchMyIndividualPairings,
  fetchMyTeamPairings,
  fetchRoundBoard,
  type BoardPairing,
  type EventInfo,
  type ItcRanking,
  type MyPairing,
  type PlacingEntry,
} from "./lib/bcp";
import {
  loadRecentEvents,
  recordRecentEvent,
  fetchRecentEventsFromServer,
  recordRecentEventOnServer,
  type RecentEvent,
} from "./lib/recentEvents";
import { fetchFollows, addFollow, removeFollow, followedKey, type Followed } from "./lib/follows";
import { useCurrentUser } from "./lib/auth";
import { logClientEvent } from "./lib/clientLog";
import { useDelayedFlag } from "./lib/useDelayedFlag";

// The default BCP event to open on first visit. Use the settings (gear)
// button in the header to switch to a different event — the choice is
// remembered locally after that.
const DEFAULT_EVENT_ID = "uC7tqqdPYLtT"; // The Challengers Cup 2026

// NOTE ON SCOPE: this app intentionally only displays data (rosters, event
// info, already-published pairings, and already-computed placings) pulled
// from BCP. It does not score, rank, or suggest pairings. Challengers Cup's
// event pack explicitly bans "AI programs, algorithms, or methodology...
// for the pairings process" — that's broader than just AI, so no
// matchup-scoring or pairing-suggestion feature should be added back into
// this app, even without any AI involved. "My pairings" and "Placings"
// only ever display decisions/results BCP has already published, never
// anything this app computed.

const EVENT_ID_STORAGE_KEY = "bcp-event-id";

// Following (Followed/followedKey) now lives in ./lib/follows — moved out
// of this file so app/lib/follows.ts's backend sync client (used only for
// a signed-in visitor; see the `user` checks below) can share the same
// type instead of redefining it.

type FollowedPairings = {
  label: string;
  pairings: MyPairing[];
  loading: boolean;
  error: string | null;
};

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort only (e.g. private browsing can throw) — not worth surfacing
  }
}

function followingKey(eventId: string) {
  return `bcp-following:${eventId}`;
}

const TAB_KEYS: TabKey[] = ["overview", "roster", "pairings", "placings"];
function isTabKey(value: string | null): value is TabKey {
  return value !== null && (TAB_KEYS as string[]).includes(value);
}

// A plain, case-insensitive substring match — the only kind of "search"
// this app does. An empty query matches everything.
function matchesSearch(text: string | undefined, query: string): boolean {
  if (!query) return true;
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

function groupByTeam(players: Player[]): Map<string, Player[]> {
  const teams = new Map<string, Player[]>();
  for (const player of players) {
    if (!player.team) continue;
    const existing = teams.get(player.team);
    if (existing) {
      existing.push(player);
    } else {
      teams.set(player.team, [player]);
    }
  }
  return teams;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-2 p-3">
        <div className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
    </div>
  );
}

function HomeContent() {
  // These start from fixed, SSR-safe defaults rather than reading
  // localStorage in a lazy useState initializer. That read can't happen on
  // the server (no `window`), so a lazy initializer would make the
  // client's very first render — which React diffs against the
  // server-rendered HTML during hydration — come out different from what
  // the server sent whenever a real event/following/recents value was
  // actually stored. That mismatch is exactly what produces a "Hydration
  // failed" error. The mount effect below (`hydrated`) swaps in the real,
  // stored values right after hydration completes, once it's safe to
  // render something the server couldn't have known about.
  const [eventId, setEventId] = React.useState(DEFAULT_EVENT_ID);
  const [hydrated, setHydrated] = React.useState(false);

  // Following and recent-events sync to the signed-in account's own
  // backend storage instead of localStorage once `checked` is true and
  // `user` is non-null (see app/lib/follows.ts / app/lib/recentEvents.ts's
  // *Server functions) — a signed-out visitor keeps the original
  // localStorage-only behavior unchanged. Waiting on `checked` (rather
  // than treating "not yet known" as signed-out) avoids a flash where a
  // signed-in visitor's guest-mode localStorage briefly shows before the
  // real, synced list replaces it.
  const { user, checked: authChecked } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, authChecked);

  // The active tab and the search filter both live in the URL's query
  // string (`?tab=...&q=...`) instead of plain component state. Unlike
  // localStorage, the URL's query string is available identically on the
  // server and the client for the very first render, so this doesn't need
  // the same hydration-guard dance as eventId/following/recentEvents above
  // — there's nothing to "swap in" after mount. This is also what makes
  // the current tab (and whatever's typed into the search box) survive a
  // refresh and be shareable as a link.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab: TabKey = isTabKey(searchParams.get("tab")) ? (searchParams.get("tab") as TabKey) : "overview";
  const searchQuery = searchParams.get("q") ?? "";

  // Applies one or more query-param changes at once (never omit a field
  // that's changing in the same call — see the two call sites below that
  // change both tab and q together — since each call replaces the whole
  // query string built from the current URL, so two separate calls in the
  // same tick would race and the second would clobber the first's change).
  // Uses router.replace (not push) so switching tabs/typing a search never
  // piles up back-button history entries.
  const updateQuery = React.useCallback(
    (patch: { tab?: TabKey; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if ("tab" in patch) {
        if (!patch.tab || patch.tab === "overview") params.delete("tab");
        else params.set("tab", patch.tab);
      }
      if ("q" in patch) {
        if (!patch.q) params.delete("q");
        else params.set("q", patch.q);
      }
      // `event` (see the hydration effect below, which is what actually
      // reads and consumes it — search for "?event=") is a one-shot
      // "open this event" link target, not persistent URL state. It's
      // already stripped right after hydration reads it, but every
      // query update strips it too, belt-and-suspenders, so it can never
      // resurface in the address bar via some other path building off a
      // stale searchParams snapshot.
      params.delete("event");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setSearchQuery = React.useCallback((q: string) => updateQuery({ q }), [updateQuery]);

  const [eventInfo, setEventInfo] = React.useState<EventInfo | null>(null);
  const [players, setPlayers] = React.useState<Player[]>([]);
  // BCP's current flagship ITC ranking league id, used to link each player
  // card to their already-published BCP ranking profile — see
  // fetchCurrentItcLeagueId's doc comment in lib/bcp.ts. Null until it
  // resolves; player cards fall back to an unscoped profile link until then.
  const [itcLeagueId, setItcLeagueId] = React.useState<string | null>(null);
  // ITC ranking (score + rank), keyed by BCP global user id. Only ever
  // populated for followed individual players, followed teams' own roster
  // members, and followed individual players' round-by-round opponents —
  // never a whole roster — see the lookup effect below.
  const [itcRankings, setItcRankings] = React.useState<Record<string, ItcRanking | null>>({});
  // Tracks which user ids have already been requested (successfully or
  // not), so the lookup effect below doesn't re-fetch on every render —
  // a ref rather than state since it's bookkeeping, not something that
  // should trigger a re-render on its own.
  const requestedItcIdsRef = React.useRef<Set<string>>(new Set());
  const [following, setFollowing] = React.useState<Followed[]>([]);
  const [loading, setLoading] = React.useState(true);
  const slowLoad = useDelayedFlag(loading);
  const [error, setError] = React.useState<string | null>(null);
  const [recentEvents, setRecentEvents] = React.useState<RecentEvent[]>([]);
  // Note: the shared Roster/Pairings/Placings search box's value
  // (`searchQuery`) lives in the URL's `q` param, not here — see above.

  // Keyed by followedKey(...) so each followed team/player's pairings load
  // and track independently of the others.
  const [followedPairings, setFollowedPairings] = React.useState<
    Record<string, FollowedPairings>
  >({});

  // `boardRound` is null until the event's data loads and picks a sensible
  // starting round (the latest one published) — see the first effect below.
  const [boardRound, setBoardRound] = React.useState<number | null>(null);
  const [boardEntries, setBoardEntries] = React.useState<BoardPairing[]>([]);
  const [boardLoading, setBoardLoading] = React.useState(false);
  const [boardError, setBoardError] = React.useState<string | null>(null);

  const [placings, setPlacings] = React.useState<PlacingEntry[]>([]);
  const [placingsLoading, setPlacingsLoading] = React.useState(false);
  const [placingsError, setPlacingsError] = React.useState<string | null>(null);

  // Client-only hydration from localStorage, run exactly once right after
  // mount — see the comment on `eventId`'s initial state above for why
  // this can't happen in a lazy useState initializer instead. Everything
  // read here (which event, who's followed, recently-viewed events)
  // depends on the browser's localStorage and simply doesn't exist yet on
  // the server, so it can only be applied once we're safely past the
  // hydration check.
  useEffect(() => {
    // Waits for the sign-in check too — see the comment on `user` above —
    // so this only runs once whether to sync from the server or from
    // localStorage is actually known.
    if (!authChecked) return;

    // Wrapped in a resolved-promise callback, like every other effect in
    // this file, so setState never runs synchronously in the effect body
    // itself — see the comment on the event-loading effect below.
    Promise.resolve().then(async () => {
      // A `?event=<id>` in the URL (see app/components/myEvents/
      // eventList.tsx's "View event page" link, which is how the My
      // Events page sends someone here) wins over whatever event was
      // last open in this browser — it's an explicit "open this one"
      // request. Persisted to localStorage the same way switching events
      // via the settings gear is, so it's the one that comes back on a
      // plain revisit too. Either way the param itself is one-shot, not
      // meant to linger in the address bar — stripped back out below,
      // once hydration (which needs its value) is done with it.
      const eventParam = searchParams.get("event");
      const storedEventId = eventParam || readLocalStorage(EVENT_ID_STORAGE_KEY, DEFAULT_EVENT_ID);
      setEventId(storedEventId);
      if (eventParam) writeLocalStorage(EVENT_ID_STORAGE_KEY, eventParam);

      // Server-side sync (fetchFollows/fetchRecentEventsFromServer) needs
      // an approved account on the backend (api.RequireApproved) — a
      // pending/rejected account falls back to the same guest-mode
      // localStorage path as signed-out below, rather than firing a
      // request that can only 403.
      if (user && user.status === "approved") {
        const [follows, recents] = await Promise.all([
          fetchFollows(storedEventId).catch((err: unknown) => {
            logClientEvent("warn", "fetching synced follows failed, starting empty", {
              error: err instanceof Error ? err.message : String(err),
            });
            return [] as Followed[];
          }),
          fetchRecentEventsFromServer().catch((err: unknown) => {
            logClientEvent("warn", "fetching synced recent events failed, starting empty", {
              error: err instanceof Error ? err.message : String(err),
            });
            return [] as RecentEvent[];
          }),
        ]);
        setFollowing(follows);
        setRecentEvents(recents);
      } else {
        setFollowing(readLocalStorage<Followed[]>(followingKey(storedEventId), []));
        setRecentEvents(loadRecentEvents());
      }
      setHydrated(true);

      if (eventParam) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("event");
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }
    });
    // Intentionally omits `user` from its own re-run condition beyond
    // `authChecked` flipping true once — signing in/out mid-session
    // doesn't re-hydrate this initial load; see stopFollowing/
    // startFollowing/handleChangeEvent below for where `user` is read on
    // every subsequent follow/unfollow and event change instead. Also
    // omits searchParams/router/pathname — this only ever needs to read
    // whatever `?event=` the page happened to load with once, at mount;
    // it's not meant to react to later URL changes (that's what
    // handleChangeEvent's own updateQuery call is for).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  // Load this event's data whenever the selected event changes. Waits for
  // the hydration effect above so it never fetches the fixed default event
  // only to immediately re-fetch the real stored one. The actual state
  // *reset* (loading/error/players/following) happens in the event
  // handler that changes `eventId` (see handleChangeEvent below) rather
  // than here, so this effect only ever calls setState from its async
  // callbacks — never synchronously in the effect body itself.
  useEffect(() => {
    if (!hydrated) return;
    // The backend now requires an approved session on every BCP route
    // (the whole app is behind sign-in *and* approval, not just the
    // account-specific features) — skip the fetch entirely rather than
    // let it 401/403. Safe to read from closure without adding `user`
    // to this effect's deps: `hydrated` only ever flips true after the
    // sign-in check has already resolved (see the effect above), so
    // `user`'s value is already settled by the time this effect's
    // dependency actually changes. Below that, `user` is also read from
    // this same closure for a best-effort write-through sync call — not
    // worth re-running the whole event/player fetch over signing in
    // without also changing events, which is an acceptable gap for a
    // nice-to-have sync path.
    if (!user || user.status !== "approved") return;
    let cancelled = false;

    Promise.all([fetchBcpEventInfo(eventId), fetchBcpPlayers(eventId)])
      .then(([info, playerList]) => {
        if (cancelled) return;
        setEventInfo(info);
        setPlayers(playerList);
        setRecentEvents((prev) =>
          recordRecentEvent(prev, {
            id: info.id,
            name: info.name,
            teamEvent: info.teamEvent,
          })
        );
        if (user) {
          // Write-through: the local list above already updated
          // optimistically, this just persists the same fact to the
          // signed-in account so it's there on another device too. Not
          // awaited — a signed-in visitor doesn't need to wait on this to
          // keep browsing, and a failure here is a sync nice-to-have, not
          // something to surface as a page error.
          recordRecentEventOnServer({ id: info.id, name: info.name, teamEvent: info.teamEvent }).catch(
            (err: unknown) => {
              logClientEvent("warn", "syncing recent event failed", {
                error: err instanceof Error ? err.message : String(err),
              });
            }
          );
        }
        const latestPublishableRound = info.ended ? info.numberOfRounds : info.currentRound;
        setBoardRound(latestPublishableRound > 0 ? latestPublishableRound : null);

        if (info.gameSystemId) {
          fetchCurrentItcLeagueId(info.gameSystemId)
            .then((leagueId) => {
              if (!cancelled) setItcLeagueId(leagueId ?? null);
            })
            .catch(() => {
              // Non-critical — player cards just fall back to an unscoped
              // BCP profile link if this never resolves.
            });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load event data");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `user` intentionally excluded, see comment above
  }, [eventId, hydrated]);

  // Looks up "my pairings" for every followed team/player whenever the
  // followed list or the event's published-round count changes. Purely a
  // read of already-published BCP data — see the scope note above. Runs
  // regardless of which tab is active, so the Overview tab's quick summary
  // stays current even when you're not looking at the Pairings tab.
  useEffect(() => {
    if (!eventInfo || following.length === 0) return;
    const upToRound = eventInfo.ended ? eventInfo.numberOfRounds : eventInfo.currentRound;
    if (upToRound <= 0) return;

    let cancelled = false;

    following.forEach((entry) => {
      const key = followedKey(entry);
      const request =
        entry.kind === "team"
          ? fetchMyTeamPairings(eventId, entry.teamPlayerId, upToRound)
          : fetchMyIndividualPairings(eventId, entry.playerId, upToRound);

      request
        .then((result) => {
          if (cancelled) return;
          setFollowedPairings((prev) => ({
            ...prev,
            [key]: { label: entry.label, pairings: result, loading: false, error: null },
          }));
        })
        .catch((err) => {
          if (cancelled) return;
          setFollowedPairings((prev) => ({
            ...prev,
            [key]: {
              label: entry.label,
              pairings: prev[key]?.pairings ?? [],
              loading: false,
              error: err instanceof Error ? err.message : "Failed to load pairings",
            },
          }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [following, eventInfo, eventId]);

  // Looks up ITC ranking (score + rank) for: each followed individual
  // player, each followed team's own roster members, and each followed
  // individual player's round-by-round opponents — never a whole roster,
  // to avoid a burst of requests against BCP's API. Team-vs-team pairings
  // don't get an opponent lookup here since a team isn't a single ranked
  // person. Purely a read of an already-published BCP number.
  useEffect(() => {
    if (!itcLeagueId) return;

    const teamsByName = groupByTeam(players);
    const wanted = new Set<string>();

    following.forEach((entry) => {
      if (entry.kind === "player") {
        const player = players.find((p) => String(p.id) === entry.playerId);
        if (player?.bcpUserId) wanted.add(player.bcpUserId);

        const pairings = followedPairings[followedKey(entry)]?.pairings ?? [];
        pairings.forEach((p) => {
          if (p.opponentUserId) wanted.add(p.opponentUserId);
        });
      } else {
        (teamsByName.get(entry.label) ?? []).forEach((p) => {
          if (p.bcpUserId) wanted.add(p.bcpUserId);
        });
      }
    });

    const toFetch = Array.from(wanted).filter((id) => !requestedItcIdsRef.current.has(id));
    if (toFetch.length === 0) return;

    let cancelled = false;
    toFetch.forEach((bcpUserId) => {
      requestedItcIdsRef.current.add(bcpUserId);
      fetchItcRanking(bcpUserId, itcLeagueId)
        .then((ranking) => {
          if (!cancelled) setItcRankings((prev) => ({ ...prev, [bcpUserId]: ranking }));
        })
        .catch(() => {
          // Non-critical — cards just fall back to showing no ITC ranking.
          // Don't leave it in requestedItcIdsRef forever failed-and-forgotten
          // would be fine either way here, but clearing lets a later retry
          // (e.g. after reconnecting) succeed instead of staying stuck.
          if (!cancelled) requestedItcIdsRef.current.delete(bcpUserId);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [itcLeagueId, following, followedPairings, players]);

  // Fetches the full pairings board for whichever round is selected —
  // every matchup BCP has published for that round, not just a followed
  // team/player. Same "async callbacks only" shape as the effects above.
  useEffect(() => {
    if (!eventInfo || !boardRound || boardRound < 1) return;

    let cancelled = false;

    fetchRoundBoard(eventId, boardRound, eventInfo.teamEvent)
      .then((entries) => {
        if (!cancelled) {
          setBoardEntries(entries);
          setBoardError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setBoardError(err instanceof Error ? err.message : "Failed to load round");
        }
      })
      .finally(() => {
        if (!cancelled) setBoardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, boardRound, eventInfo]);

  // Placings are only fetched once the Placings tab is actually opened —
  // per CLAUDE.md's "fetch only what's needed" rule, there's no reason to
  // pull standings for events nobody's looking at. The underlying request
  // is still cached/rate-limited, so flipping tabs back and forth doesn't
  // cost extra network calls.
  useEffect(() => {
    if (activeTab !== "placings" || !eventInfo) return;

    let cancelled = false;

    fetchBcpPlacings(eventId, eventInfo.teamEvent)
      .then((entries) => {
        if (!cancelled) {
          setPlacings(entries);
          setPlacingsError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPlacingsError(err instanceof Error ? err.message : "Failed to load placings");
        }
      })
      .finally(() => {
        if (!cancelled) setPlacingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, eventId, eventInfo]);

  const teams = useMemo(() => groupByTeam(players), [players]);

  const isFollowing = (key: string) => following.some((f) => followedKey(f) === key);

  // Persists a follow/unfollow to whichever backing store applies —
  // localStorage for a signed-out visitor (unchanged from before), or
  // this app's own backend for a signed-in one (see app/lib/follows.ts).
  // Fire-and-forget from the caller's point of view: `following` state is
  // already updated optimistically by the caller before this runs, so a
  // failure here just means the sync silently didn't take (logged, not
  // surfaced as a page error) — the same "fail quietly" posture this
  // project's CLAUDE.md requires for third-party APIs applies here too,
  // even though this is our own backend rather than BCP.
  const persistFollowChange = (action: "add" | "remove", entry: Followed, next: Followed[]) => {
    if (user) {
      const request = action === "add" ? addFollow(eventId, entry) : removeFollow(eventId, entry);
      request.catch((err: unknown) => {
        logClientEvent("warn", `syncing follow ${action} failed`, {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    } else {
      writeLocalStorage(followingKey(eventId), next);
    }
  };

  const stopFollowing = (key: string) => {
    setFollowing((prev) => {
      const removed = prev.find((f) => followedKey(f) === key);
      const next = prev.filter((f) => followedKey(f) !== key);
      if (removed) persistFollowChange("remove", removed, next);
      return next;
    });
    // A direct user action (the pill's ×, or clicking "Follow" again) —
    // clear the stale results right away rather than waiting on the
    // lookup effect, which only runs while there's something to look up.
    setFollowedPairings((prev) => {
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
  };

  const startFollowing = (entry: Followed) => {
    const key = followedKey(entry);
    setFollowing((prev) => {
      if (prev.some((f) => followedKey(f) === key)) return prev;
      const next = [...prev, entry];
      persistFollowChange("add", entry, next);
      return next;
    });
    setFollowedPairings((prev) => ({
      ...prev,
      [key]: { label: entry.label, pairings: [], loading: true, error: null },
    }));
  };

  // Clicking "Follow" a second time unfollows — same button toggles both
  // ways.
  const toggleFollowing = (entry: Followed) => {
    const key = followedKey(entry);
    if (isFollowing(key)) {
      stopFollowing(key);
    } else {
      startFollowing(entry);
    }
  };

  const toggleFollowTeam = (teamName: string) => {
    const teamPlayerId = teams.get(teamName)?.[0]?.teamPlayerId;
    if (!teamPlayerId) return;
    toggleFollowing({ kind: "team", teamPlayerId, label: teamName });
  };
  const toggleFollowPlayer = (player: Player) => {
    toggleFollowing({ kind: "player", playerId: String(player.id), label: player.name });
  };

  const handleChangeEvent = (id: string) => {
    setEventId(id);
    writeLocalStorage(EVENT_ID_STORAGE_KEY, id);
    // These resets happen here, in a direct event handler, rather than in
    // the data-loading effect above — the effect only ever sets state from
    // its async callbacks. Tab and search filter reset together in one
    // updateQuery call (see its comment above for why that has to be a
    // single call rather than two).
    updateQuery({ tab: "overview", q: "" });
    setEventInfo(null);
    setPlayers([]);
    setItcLeagueId(null);
    setItcRankings({});
    requestedItcIdsRef.current = new Set();
    setLoading(true);
    setError(null);
    if (user) {
      setFollowing([]); // cleared immediately; the fetch below replaces it once it resolves
      fetchFollows(id)
        .then(setFollowing)
        .catch((err: unknown) => {
          logClientEvent("warn", "fetching synced follows for new event failed, staying empty", {
            error: err instanceof Error ? err.message : String(err),
          });
        });
    } else {
      setFollowing(readLocalStorage<Followed[]>(followingKey(id), []));
    }
    setFollowedPairings({});
    setBoardRound(null);
    setBoardEntries([]);
    setBoardError(null);
    setPlacings([]);
    setPlacingsError(null);
  };

  const changeBoardRound = (round: number) => {
    if (!eventInfo) return;
    const maxRound = eventInfo.ended ? eventInfo.numberOfRounds : eventInfo.currentRound;
    const clamped = Math.min(Math.max(round, 1), Math.max(maxRound, 1));
    setBoardLoading(true);
    setBoardRound(clamped);
  };

  const changeTab = (tab: TabKey) => {
    updateQuery({ tab });
    if (tab === "placings" && placings.length === 0) {
      // A direct user action (clicking the tab) — the placings-loading
      // effect only ever sets state from its own async callbacks, so the
      // "starting to load" flag is set here instead.
      setPlacingsLoading(true);
    }
  };

  const isTeamEvent = eventInfo?.teamEvent ?? true;

  // Every team/player is always shown — followed ones first (in the order
  // followed), then alphabetical — rather than requiring you to pick which
  // ones to see.
  const followedOrder = new Map(following.map((f, i) => [followedKey(f), i]));
  const teamFollowedRank = (team: string) => {
    const teamPlayerId = teams.get(team)?.[0]?.teamPlayerId;
    if (!teamPlayerId) return undefined;
    return followedOrder.get(followedKey({ kind: "team", teamPlayerId, label: team }));
  };
  const playerFollowedRank = (player: Player) =>
    followedOrder.get(followedKey({ kind: "player", playerId: String(player.id), label: player.name }));

  const sortedTeamNames = Array.from(teams.keys()).sort((a, b) => {
    const aRank = teamFollowedRank(a);
    const bRank = teamFollowedRank(b);
    if ((aRank !== undefined) !== (bRank !== undefined)) return aRank !== undefined ? -1 : 1;
    if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
    return a.localeCompare(b);
  });
  const sortedPlayers = [...players].sort((a, b) => {
    const aRank = playerFollowedRank(a);
    const bRank = playerFollowedRank(b);
    if ((aRank !== undefined) !== (bRank !== undefined)) return aRank !== undefined ? -1 : 1;
    if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
    return a.name.localeCompare(b.name);
  });

  const upToRound = eventInfo
    ? eventInfo.ended
      ? eventInfo.numberOfRounds
      : eventInfo.currentRound
    : 0;

  // Ids of everyone followed, in whichever id-space the current event uses
  // (teamPlayerId for team events, player id for singles) — this is what
  // lets Pairings/Placings highlight their rows.
  const followedIds = new Set(
    following.map((f) => (f.kind === "team" ? f.teamPlayerId : f.playerId))
  );

  // --- Search filtering ------------------------------------------------
  // A plain client-side name filter shared by Roster, Pairings, and
  // Placings — see the note on `searchQuery`'s state above. Never changes
  // what's fetched, only what's shown from what's already loaded.
  const playerMatches = (player: Player) =>
    matchesSearch(player.name, searchQuery) ||
    matchesSearch(player.faction, searchQuery) ||
    matchesSearch(player.subFaction, searchQuery);

  const filteredTeamNames = sortedTeamNames.filter(
    (team) => matchesSearch(team, searchQuery) || (teams.get(team) ?? []).some(playerMatches)
  );
  const filteredPlayers = sortedPlayers.filter(playerMatches);
  const filteredFollowing = following.filter((entry) => matchesSearch(entry.label, searchQuery));
  const filteredBoardEntries = boardEntries.filter(
    (entry) =>
      matchesSearch(entry.side1Name, searchQuery) || matchesSearch(entry.side2Name, searchQuery)
  );
  const filteredPlacings = placings.filter((entry) => matchesSearch(entry.name, searchQuery));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-4 px-4 pt-4 pb-2 sm:pt-8">
        <div className="flex items-start gap-3">
          <HamburgerButton />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              Brass Ledger
            </h1>
            <p className="mt-1 hidden text-sm text-zinc-500 dark:text-zinc-400 sm:block">
              Pulls roster, published-pairing, and placings data straight from Best Coast
              Pairings for reference — it doesn&apos;t score or suggest pairings.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {following.map((entry) => (
            <FollowingPill
              key={followedKey(entry)}
              label={entry.label}
              onStop={() => stopFollowing(followedKey(entry))}
            />
          ))}
          <EventSettings
            eventId={eventId}
            eventName={eventInfo?.name}
            recentEvents={recentEvents.filter((e) => e.id !== eventId)}
            onChangeEvent={handleChangeEvent}
          />
        </div>
      </header>

      {!authChecked || !user ? null : user.status !== "approved" ? (
        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
          <AccessStatusMessage status={user.status} />
        </main>
      ) : (
        <>
          {error && (
            <div className="mx-auto max-w-5xl px-4">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                Couldn&apos;t load event data: {error}
              </div>
            </div>
          )}

          <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 pt-2 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
            <TabBar active={activeTab} onChange={changeTab} />
          </div>

          <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {(activeTab === "roster" || activeTab === "pairings" || activeTab === "placings") && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              activeTab === "roster"
                ? "Search teams, players, factions…"
                : activeTab === "pairings"
                  ? "Search teams or players…"
                  : "Search standings…"
            }
          />
        )}

        {activeTab === "overview" && (
          <OverviewPanel
            eventInfo={eventInfo}
            following={following.map((entry) => ({
              label: entry.label,
              pairings: followedPairings[followedKey(entry)]?.pairings ?? [],
            }))}
            onGoToRoster={() => changeTab("roster")}
            onGoToPairings={() => changeTab("pairings")}
          />
        )}

        {activeTab === "roster" && (
          <>
            {loading ? (
              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
                {slowLoad && (
                  <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
                    Taking longer than usual — this is a first look at this event, so it&apos;s
                    asking Best Coast Pairings directly.
                  </p>
                )}
              </div>
            ) : isTeamEvent ? (
              sortedTeamNames.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No rosters published for this event yet.
                </p>
              ) : filteredTeamNames.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No teams or players match &ldquo;{searchQuery}&rdquo;.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredTeamNames.map((team) => (
                    <TeamRoster
                      key={team}
                      teamName={team}
                      players={teams.get(team) ?? []}
                      onTrack={() => toggleFollowTeam(team)}
                      tracked={teamFollowedRank(team) !== undefined}
                      itcLeagueId={itcLeagueId}
                      itcRankings={itcRankings}
                    />
                  ))}
                </div>
              )
            ) : sortedPlayers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                No players published for this event yet.
              </p>
            ) : filteredPlayers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                No players match &ldquo;{searchQuery}&rdquo;.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onTrack={() => toggleFollowPlayer(player)}
                    tracked={playerFollowedRank(player) !== undefined}
                    itcLeagueId={itcLeagueId}
                    itcRanking={player.bcpUserId ? itcRankings[player.bcpUserId] : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "pairings" && (
          <>
            {filteredFollowing.map((entry) => {
              const key = followedKey(entry);
              const fp = followedPairings[key];
              const ownBcpUserId =
                entry.kind === "player"
                  ? players.find((p) => String(p.id) === entry.playerId)?.bcpUserId
                  : undefined;
              return (
                <MyPairings
                  key={key}
                  eventId={eventId}
                  whoLabel={entry.label}
                  loading={fp?.loading ?? true}
                  error={fp?.error ?? null}
                  pairings={fp?.pairings ?? []}
                  upToRound={upToRound}
                  onClear={() => stopFollowing(key)}
                  ownItc={ownBcpUserId ? itcRankings[ownBcpUserId] : undefined}
                  itcByUserId={itcRankings}
                  itcLeagueId={itcLeagueId}
                  ownBcpUserId={ownBcpUserId}
                />
              );
            })}

            {boardRound && (
              <RoundBoard
                eventId={eventId}
                round={boardRound}
                minRound={1}
                maxRound={Math.max(upToRound, boardRound)}
                entries={filteredBoardEntries}
                loading={boardLoading}
                error={boardError}
                onRoundChange={changeBoardRound}
                followedIds={followedIds}
                teamEvent={isTeamEvent}
                itcLeagueId={itcLeagueId}
                emptyMessage={
                  searchQuery && boardEntries.length > 0
                    ? `No pairings match "${searchQuery}" in round ${boardRound}.`
                    : undefined
                }
              />
            )}
          </>
        )}

        {activeTab === "placings" && (
          <PlacingsTable
            entries={filteredPlacings}
            loading={placingsLoading}
            error={placingsError}
            followedIds={followedIds}
            emptyMessage={
              searchQuery && placings.length > 0
                ? `No placings match "${searchQuery}".`
                : undefined
            }
          />
        )}
          </main>
        </>
      )}
    </div>
  );
}

// useSearchParams (used above to read the active tab and search filter
// straight from the URL) requires a Suspense boundary above it per Next's
// app router rules — this wrapper is that boundary. The fallback should
// essentially never be visible in practice: the page is entirely
// client-rendered already (loading/CardSkeleton etc. above handle the
// real "data not in yet" states), this only covers the brief moment
// before the URL's search params are available.
export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
