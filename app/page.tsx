"use client";
import React from "react";
import Link from "next/link";

import BcpProfileLinker from "./components/myEvents/bcpProfileLinker";
import { ordinal } from "./lib/formatStats";
import AccessStatusMessage from "./components/shared/accessStatusMessage";
import EmptyState from "./components/shared/emptyState";
import Skeleton from "./components/shared/skeleton";
import Card from "./components/ui/card";
import PageHeader from "./components/layout/pageHeader";
import PageMain from "./components/layout/pageMain";
import { useCurrentUser } from "./lib/auth";
import { useRedirectToLoginIfSignedOut } from "./lib/useRedirectToLoginIfSignedOut";
import { fetchMyEvents, type MyEvent, type MyEvents } from "./lib/myEvents";
import { fetchMyStats, type MyStats } from "./lib/myStats";
import {
  fetchFriends,
  fetchIncomingFriendRequests,
  type Friend,
  type IncomingFriendRequest,
} from "./lib/friends";
import { loadRecentEvents, fetchRecentEventsFromServer, type RecentEvent } from "./lib/recentEvents";
import { useHiddenDashboardCards } from "./lib/dashboardCards";
import { formatCountdown, formatDateRange } from "./lib/eventDates";
import { logClientEvent } from "./lib/clientLog";

// --- "Next up" -------------------------------------------------------
//
// Priority: an event that's actually in progress beats one that's only
// coming up — same "happening now matters more than later" ordering My
// Events' own Ongoing-before-Future tab order implies, just collapsed
// into a single hero slot instead of separate tabs. Everything here is
// classification of data GET /api/me/events already returns (My Events
// and Calendar's own data source) — nothing new is fetched to build
// this slot.

/** The single event this hero should feature: the first Present entry
 * if any (something's actually running right now), else whichever
 * Future entry starts soonest, else undefined (nothing upcoming). */
function pickNextUp(events: MyEvents | null): { event: MyEvent; live: boolean } | undefined {
  if (!events) return undefined;
  if (events.present.length > 0) return { event: events.present[0], live: true };
  if (events.future.length === 0) return undefined;
  const sorted = [...events.future].sort((a, b) => {
    const aTime = a.startDate ? new Date(a.startDate).getTime() : Infinity;
    const bTime = b.startDate ? new Date(b.startDate).getTime() : Infinity;
    return aTime - bTime;
  });
  return { event: sorted[0], live: false };
}

function NextUpCard({ events }: { events: MyEvents | null }) {
  if (events === null) {
    return (
      <Card role="status" aria-live="polite" className="p-4 shadow-sm">
        <span className="sr-only">Loading your events…</span>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-5 w-48" />
        <Skeleton className="mt-2 h-8 w-28" />
      </Card>
    );
  }

  const next = pickNextUp(events);
  if (!next) {
    return (
      <Card className="p-4 shadow-sm">
        <EmptyState
          icon={
            <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          }
          title="Nothing on the horizon"
          message={
            <>
              Nothing registered as upcoming yet.{" "}
              <Link href="/calendar" className="text-brass-400 hover:underline">
                Check the calendar
              </Link>{" "}
              or browse{" "}
              <Link href="/my-events" className="text-brass-400 hover:underline">
                My Events
              </Link>
              .
            </>
          }
          className="border-none p-0"
        />
      </Card>
    );
  }

  const { event, live } = next;
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const countdown = formatCountdown(event.startDate, event.endDate);

  return (
    <Card className="animate-fade-in border-brass-500/40 p-4 shadow-sm ring-1 ring-brass-500/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-brass-500">
        {live ? "Happening now" : "Next up"}
      </p>
      <p className="mt-1 font-semibold text-text-primary">{event.eventName}</p>
      <p className="mt-1 text-sm text-text-secondary">
        {countdown && <span className="text-brass-400">{countdown}</span>}
        {countdown && dateRange && " · "}
        {dateRange}
      </p>
      {/* Styled to match Button's secondary/sm look directly, rather than
          nesting a real <button> inside next/link's <a> — invalid HTML
          (interactive content inside interactive content) that Button
          itself doesn't guard against. */}
      <Link
        href={`/event?event=${encodeURIComponent(event.eventId)}`}
        className="mt-3 inline-flex rounded-md border border-surface-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text-primary shadow-sm hover:bg-surface-1"
      >
        {live ? "Continue to your round →" : "View event →"}
      </Link>
    </Card>
  );
}

/** The small "×" a dismissible dashboard card shows next to its own
 * title (see useHiddenDashboardCards in lib/dashboardCards.ts) — one
 * shared button so all three cards' dismiss controls look and behave
 * identically, same "×" glyph SearchBar's own clear button already
 * uses elsewhere in the app. */
function DismissCardButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Hide this card"
      title="Hide this card"
      className="shrink-0 rounded-full p-1 text-sm leading-none text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
    >
      ×
    </button>
  );
}

// --- Friends -----------------------------------------------------------
//
// Deliberately just counts here — not "which friends have an event
// coming up," which would mean calling GET /api/friends/:bcpUserId/events
// (real BCP-backed work via classifyMyEvents) once per friend on every
// Home load. That's exactly the kind of "fetch more than this page
// actually needs" this project's CLAUDE.md warns against — the full
// picture is one click away on /friends instead, where the lazy
// per-friend disclosure (FriendRow) already exists. Both fetches here
// (ListFriends/ListIncomingFriendRequests) are pure local-database reads
// with no BCP cost at all, so this module stays cheap regardless.

function FriendsCard({
  requests,
  friends,
  onHide,
}: {
  requests: IncomingFriendRequest[] | null;
  friends: Friend[] | null;
  onHide?: () => void;
}) {
  const loading = requests === null || friends === null;
  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary">Friends</p>
        {onHide && <DismissCardButton onClick={onHide} />}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-4 w-32" />
      ) : (
        <>
          {requests.length > 0 && (
            <p className="mt-1 text-sm text-brass-400">
              {requests.length} request{requests.length === 1 ? "" : "s"} waiting
            </p>
          )}
          <p className="mt-1 text-sm text-text-secondary">
            {friends.length === 0
              ? "Not friends with anyone yet."
              : `${friends.length} friend${friends.length === 1 ? "" : "s"}.`}
          </p>
        </>
      )}
      <Link href="/friends" className="mt-2 inline-block text-xs font-medium text-brass-400 hover:underline">
        {loading ? "Go to Friends →" : requests && requests.length > 0 ? "Review requests →" : "See friends →"}
      </Link>
    </Card>
  );
}

// --- Your record ---------------------------------------------------------
//
// A teaser of /stats, not a second copy of it — three tiles, no ITC
// badge, no faction breakdown, no trend chart. See /stats' own
// PlayerStatsPanel for the full picture this links out to.

function RecordCard({ stats, onHide }: { stats: MyStats | null; onHide?: () => void }) {
  const header = (
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-semibold text-text-primary">Your record</p>
      {onHide && <DismissCardButton onClick={onHide} />}
    </div>
  );

  if (stats === null) {
    return (
      <Card className="p-4 shadow-sm">
        {header}
        <Skeleton className="mt-2 h-10 w-full" />
      </Card>
    );
  }

  if (!stats.linked || stats.totalEvents === 0) {
    return (
      <Card className="p-4 shadow-sm">
        {header}
        <p className="mt-1 text-sm text-text-secondary">
          No concluded events yet — this fills in once Best Coast Pairings has a final placing for
          one of yours.
        </p>
      </Card>
    );
  }

  const topFaction = stats.factions[0]?.faction;

  return (
    <Card className="p-4 shadow-sm">
      {header}
      <div className="mt-2 grid grid-cols-3 gap-1 overflow-hidden rounded-md border border-surface-border">
        <div className="bg-surface-2 px-2 py-2 text-center">
          <div className="text-base font-semibold text-text-primary tabular-nums">{stats.totalEvents}</div>
          <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Events</div>
        </div>
        <div className="bg-surface-2 px-2 py-2 text-center">
          <div className="text-base font-semibold text-text-primary">
            {stats.bestPlacing ? ordinal(stats.bestPlacing.placing) : "—"}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Best placing</div>
        </div>
        <div className="bg-surface-2 px-2 py-2 text-center">
          <div className="truncate text-base font-semibold text-text-primary">{topFaction ?? "—"}</div>
          <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Top faction</div>
        </div>
      </div>
      <Link href="/stats" className="mt-2 inline-block text-xs font-medium text-brass-400 hover:underline">
        Full stats →
      </Link>
    </Card>
  );
}

// --- Jump back in --------------------------------------------------------
//
// recentEvents.ts's data already exists and is already synced — today
// it's only ever surfaced inside EventSettings' event-switcher dropdown
// on the /event page itself, invisible until you're already looking at
// some other event. Elevating it here costs nothing new to fetch.

function JumpBackInCard({ events, onHide }: { events: RecentEvent[]; onHide?: () => void }) {
  if (events.length === 0) return null;
  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary">Jump back in</p>
        {onHide && <DismissCardButton onClick={onHide} />}
      </div>
      <ul className="mt-2 flex flex-col divide-y divide-surface-border">
        {events.slice(0, 5).map((event) => (
          <li key={event.id}>
            <Link
              href={`/event?event=${encodeURIComponent(event.id)}`}
              className="block truncate py-1.5 text-sm text-text-secondary hover:text-brass-400 hover:underline"
            >
              {event.name}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * What the dashboard looks like while the sign-in check is still in
 * flight. Previously this area rendered nothing at all, so a visitor saw
 * the page header floating above blank space until /api/me came back —
 * the single most visible part of this app's load, and the one thing
 * none of the bundle work above could fix.
 *
 * Mirrors the real card layout below (hero, two-up row, wide card) so
 * the content doesn't jump when it arrives.
 */
function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading your dashboard…</span>
      <Card className="p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-6 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/3" />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
      </Card>
    </div>
  );
}

/**
 * Home — a cross-event dashboard, and the app's new landing route as of
 * the home-dashboard rewrite. The tabbed single-event view that used to
 * live at "/" (Overview/Mine/Team/Roster/Pairings/Placings) moved to
 * "/event" unchanged; this page is new, built to be useful *between*
 * events rather than assuming one is already selected. Four modules,
 * each reusing a fetch this app already makes somewhere else (My
 * Events/Calendar's fetchMyEvents, /stats' fetchMyStats, /friends'
 * fetchFriends/fetchIncomingFriendRequests, and the event-switcher's
 * recentEvents sync) — no new backend load pattern anywhere on this
 * page. See NextUpCard/FriendsCard's own doc comments for what was
 * deliberately left out to keep it that way (a per-friend "who's also
 * going" scan, mainly).
 */
function HomeContent() {
  const { user, checked, setUser } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, checked);
  // Derived directly from `user`, not its own useState+useEffect — user
  // itself is already null on both server and first client render (it
  // only becomes non-null once the /api/me lookup resolves), so there's
  // no hydration-mismatch risk here the way app/event/page.tsx's
  // eventId has (that one reads localStorage, unavailable on the
  // server, which is what actually needs the deferred-state pattern).
  const bcpUserId = user?.bcpUserId || undefined;

  const [events, setEvents] = React.useState<MyEvents | null>(null);
  const [stats, setStats] = React.useState<MyStats | null>(null);
  const [friendRequests, setFriendRequests] = React.useState<IncomingFriendRequest[] | null>(null);
  const [friends, setFriends] = React.useState<Friend[] | null>(null);
  const [recentEvents, setRecentEvents] = React.useState<RecentEvent[]>([]);
  const { hidden: hiddenCards, hide: hideCard, showAll: showAllCards } = useHiddenDashboardCards();

  // Friends + recent events need no linked BCP profile — and, since
  // they're scoped by the session cookie rather than by anything in
  // `user`, they don't need the /api/me result either. So they fire on
  // mount, racing the sign-in check instead of queueing behind it: that
  // takes the Friends and Jump-back-in cards from two round trips to
  // one.
  //
  // The trade is that a signed-out visitor fires three requests that
  // 401. That's deliberate and cheap — they're redirected to /login the
  // moment the check resolves anyway — and it's why none of the three
  // logs on failure: "not signed in" is an expected outcome of racing
  // the check, not something worth a line in frontend.log. Each card
  // just stays empty, which is the same thing that happened before when
  // the fetch was skipped outright.
  React.useEffect(() => {
    let cancelled = false;

    fetchIncomingFriendRequests()
      .then((r) => {
        if (!cancelled) setFriendRequests(r);
      })
      .catch(() => {});
    fetchFriends()
      .then((f) => {
        if (!cancelled) setFriends(f);
      })
      .catch(() => {});
    fetchRecentEventsFromServer()
      .then((events) => {
        if (!cancelled) setRecentEvents(events);
      })
      .catch(() => {
        // Falls back to this device's own localStorage list, which is
        // also what a signed-out visitor would have had.
        if (!cancelled) setRecentEvents(loadRecentEvents());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Next up / Your record both need a linked BCP profile — only fetched
  // once one exists, same gating /my-events, /calendar, and /stats each
  // already apply on their own.
  React.useEffect(() => {
    if (!bcpUserId) return;
    let cancelled = false;

    fetchMyEvents()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err: unknown) => {
        logClientEvent("warn", "home: fetching my events failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    fetchMyStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err: unknown) => {
        logClientEvent("warn", "home: fetching my stats failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [bcpUserId]);

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader
        title="Brass Ledger"
        subtitle="Already-published data from Best Coast Pairings, your own account, and whoever you've friended — nothing here is scored or suggested."
      />

      <PageMain>
        {!checked ? (
          <DashboardSkeleton />
        ) : !user ? null : user.status !== "approved" ? (
          <AccessStatusMessage status={user.status} />
        ) : (
          <div className="flex flex-col gap-4">
            {!bcpUserId ? (
              <Card className="p-4">
                <BcpProfileLinker
                  onLinked={(id) => {
                    setUser((prev) => (prev ? { ...prev, bcpUserId: id } : prev));
                  }}
                />
              </Card>
            ) : (
              <NextUpCard events={events} />
            )}

            {(!hiddenCards.has("friends") || (bcpUserId && !hiddenCards.has("record"))) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {!hiddenCards.has("friends") && (
                  <FriendsCard
                    requests={friendRequests}
                    friends={friends}
                    onHide={() => hideCard("friends")}
                  />
                )}
                {bcpUserId && !hiddenCards.has("record") && (
                  <RecordCard stats={stats} onHide={() => hideCard("record")} />
                )}
              </div>
            )}

            {!hiddenCards.has("jumpBackIn") && (
              <JumpBackInCard events={recentEvents} onHide={() => hideCard("jumpBackIn")} />
            )}

            {hiddenCards.size > 0 && (
              <button
                type="button"
                onClick={showAllCards}
                className="self-start text-xs font-medium text-text-tertiary hover:text-text-secondary hover:underline"
              >
                {hiddenCards.size} card{hiddenCards.size === 1 ? "" : "s"} hidden — Show all
              </button>
            )}
          </div>
        )}
      </PageMain>
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
