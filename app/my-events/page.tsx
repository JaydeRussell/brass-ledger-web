"use client";
import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import HamburgerButton from "../components/nav/hamburgerButton";
import BcpProfileLinker from "../components/myEvents/bcpProfileLinker";
import EventList from "../components/myEvents/eventList";
import Spinner from "../components/shared/spinner";
import AccessStatusMessage from "../components/shared/accessStatusMessage";
import { Tabs, type TabItem } from "../components/ui/tabs";
import { useDelayedFlag } from "../lib/useDelayedFlag";
import { useCurrentUser } from "../lib/auth";
import { useRedirectToLoginIfSignedOut } from "../lib/useRedirectToLoginIfSignedOut";
import { fetchMyEvents, type MyEvent, type MyEvents } from "../lib/myEvents";
import { logClientEvent } from "../lib/clientLog";

// "Ongoing" here is this page's name for what the backend calls
// "present" (see internal/api/me.go's myEventsResponse) — events that
// have started but not ended. Kept as a separate, page-local vocabulary
// rather than renaming the API field, since "present" reads fine as a
// JSON key but "ongoing" reads better as a tab label.
type EventsTabKey = "past" | "ongoing" | "future";
const TAB_KEYS: EventsTabKey[] = ["past", "ongoing", "future"];
const TAB_LABELS: Record<EventsTabKey, string> = {
  past: "Past",
  ongoing: "Ongoing",
  future: "Future",
};

function isTabKey(value: string | null): value is EventsTabKey {
  return value !== null && (TAB_KEYS as string[]).includes(value);
}

function eventsForTab(events: MyEvents | null, tab: EventsTabKey): MyEvent[] {
  if (!events) return [];
  switch (tab) {
    case "past":
      return events.past;
    case "ongoing":
      return events.present;
    case "future":
      return events.future;
  }
}

function countForTab(events: MyEvents | null, tab: EventsTabKey): number | undefined {
  if (!events) return undefined;
  return eventsForTab(events, tab).length;
}

/**
 * "just now" / "5m ago" / "3h ago" / "2d ago" — deliberately coarse
 * (nothing more precise than minutes) since this is about "is this
 * roughly fresh," not an exact clock. Empty string if iso can't be
 * parsed, so a caller can just skip rendering rather than show garbage.
 */
function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.round(diffHour / 24)}d ago`;
}

function MyEventsContent() {
  const { user, checked, setUser } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, checked);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Same URL-query-string tab pattern as the main page (see app/page.tsx)
  // — defaults to "ongoing" rather than "past", since the events you're
  // most likely to want to check on are the ones happening right now.
  const activeTab: EventsTabKey = isTabKey(searchParams.get("tab"))
    ? (searchParams.get("tab") as EventsTabKey)
    : "ongoing";

  const changeTab = (tab: EventsTabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "ongoing") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const bcpUserId = user?.bcpUserId ?? "";
  const [events, setEvents] = React.useState<MyEvents | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [changingProfile, setChangingProfile] = React.useState(false);
  const slowLoad = useDelayedFlag(loading);
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshError, setRefreshError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // GET /api/me/events requires an approved account on the backend
    // (api.RequireApproved) — skip the fetch entirely rather than let
    // it 403 for a pending/rejected account that's already linked a
    // profile (SetBcpProfile itself doesn't require approval — see
    // brass-ledger-api's me.go — so bcpUserId can be set here before
    // approval).
    if (!bcpUserId || user?.status !== "approved") {
      setEvents(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchMyEvents()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        logClientEvent("info", "my events: loaded", {
          past: data.past.length,
          present: data.present.length,
          future: data.future.length,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setLoadError(message);
        logClientEvent("error", "my events: failed to load", { error: message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bcpUserId, user?.status]);

  // An explicit "check again now" for Ongoing/Future only — Past never
  // needs this, since an already-concluded event's placing can't change.
  // See internal/api/me.go's ?refresh=true and the doc comment on
  // MyEvents.upcomingFetchedAt in lib/myEvents.ts for why this is scoped
  // the way it is, and CLAUDE.md's "fetch only what's needed" for why
  // this isn't something to trigger automatically/on a timer.
  const handleRefresh = () => {
    if (!bcpUserId || refreshing) return;
    setRefreshing(true);
    setRefreshError(null);
    fetchMyEvents(true)
      .then((data) => {
        setEvents(data);
        logClientEvent("info", "my events: refreshed", {
          present: data.present.length,
          future: data.future.length,
        });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setRefreshError(message);
        logClientEvent("error", "my events: refresh failed", { error: message });
      })
      .finally(() => setRefreshing(false));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-4 pb-2 sm:pt-8">
        <HamburgerButton />
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
          My Events
        </h1>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {!checked || !user ? null : user.status !== "approved" ? (
          <AccessStatusMessage status={user.status} />
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border">
              <Tabs
                value={activeTab}
                onValueChange={changeTab}
                label="My events range"
                tabs={TAB_KEYS.map(
                  (tab): TabItem<EventsTabKey> => ({
                    value: tab,
                    label: (() => {
                      const count = countForTab(events, tab);
                      return count !== undefined ? `${TAB_LABELS[tab]} (${count})` : TAB_LABELS[tab];
                    })(),
                  })
                )}
              />
              <button
                type="button"
                onClick={() => setChangingProfile(true)}
                className="pb-2 text-xs text-text-secondary hover:underline"
              >
                Change profile
              </button>
            </div>

            {!loading && !loadError && events && activeTab !== "past" && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                <span>
                  {events.upcomingFetchedAt
                    ? `Last checked ${formatRelativeTime(events.upcomingFetchedAt)} — new sign-ups or an event starting won't show up until you check again.`
                    : "Not checked yet."}
                </span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {refreshing && <Spinner size="sm" />}
                  {refreshing ? "Checking…" : "Check for updates"}
                </button>
              </div>
            )}
            {refreshError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                Couldn&apos;t check for updates: {refreshError}
              </div>
            )}

            {loading && (
              <div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <Spinner size="sm" />
                  <span>Loading…</span>
                </div>
                {slowLoad && (
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    Taking longer than usual — this app hasn&apos;t seen some of your events
                    before, so it&apos;s asking Best Coast Pairings for them the first time.
                  </p>
                )}
              </div>
            )}
            {loadError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                Couldn&apos;t load events: {loadError}
              </div>
            )}
            {!loading && !loadError && (
              <EventList
                // Keyed by tab so React fully remounts the list (and
                // EventCard's key-based reconciliation starts fresh)
                // instead of diffing against the previous tab's items —
                // belt-and-suspenders against any stale-DOM carryover
                // between tabs.
                key={activeTab}
                events={eventsForTab(events, activeTab)}
                emptyMessage={`No ${TAB_LABELS[activeTab].toLowerCase()} events found.`}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Same Suspense-boundary requirement as app/page.tsx, for the same
// reason: useSearchParams needs one above it under Next's app router.
export default function MyEventsPage() {
  return (
    <Suspense fallback={null}>
      <MyEventsContent />
    </Suspense>
  );
}
