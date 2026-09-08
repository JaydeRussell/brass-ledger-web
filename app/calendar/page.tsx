"use client";
import React from "react";

import HamburgerButton from "../components/nav/hamburgerButton";
import BcpProfileLinker from "../components/myEvents/bcpProfileLinker";
import EventList from "../components/myEvents/eventList";
import MonthGrid from "../components/calendar/monthGrid";
import Spinner from "../components/shared/spinner";
import SignInPrompt from "../components/shared/signInPrompt";
import { useDelayedFlag } from "../lib/useDelayedFlag";
import { useCurrentUser } from "../lib/auth";
import { fetchMyEvents, type MyEvent, type MyEvents } from "../lib/myEvents";
import { logClientEvent } from "../lib/clientLog";

/**
 * The Calendar page: a month-grid view of the signed-in account's own
 * upcoming (present/future) events, with the same list of events
 * alongside it for full detail. Deliberately Present + Future only,
 * matching the "upcoming" framing — Past is a concluded, immutable
 * result already fully covered by /my-events' Past tab, not something
 * worth marking on a forward-looking calendar. Reuses the same
 * fetchMyEvents() data source as /my-events (no new endpoint needed)
 * and the same sign-in/link-profile gating structure as that page.
 */
export default function CalendarPage() {
  const { user, checked, setUser } = useCurrentUser();
  const bcpUserId = user?.bcpUserId ?? "";

  const [events, setEvents] = React.useState<MyEvents | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [changingProfile, setChangingProfile] = React.useState(false);
  const slowLoad = useDelayedFlag(loading);

  React.useEffect(() => {
    if (!bcpUserId) {
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
        logClientEvent("info", "calendar: loaded", {
          present: data.present.length,
          future: data.future.length,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setLoadError(message);
        logClientEvent("error", "calendar: failed to load", { error: message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bcpUserId]);

  const upcoming: MyEvent[] = events ? [...events.present, ...events.future] : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-4 pb-2 sm:pt-8">
        <HamburgerButton />
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
          Calendar
        </h1>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {!checked ? null : !user ? (
          <SignInPrompt message="see your upcoming events on a calendar." />
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
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="lg:flex-1">
                  <MonthGrid events={upcoming} />
                </div>
                <div className="lg:w-80 lg:shrink-0">
                  <h2 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    Upcoming events
                  </h2>
                  <EventList events={upcoming} emptyMessage="No upcoming events found." />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
