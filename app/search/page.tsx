"use client";
import React, { Suspense, useId } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import AccessStatusMessage from "../components/shared/accessStatusMessage";
import EmptyState from "../components/shared/emptyState";
import Spinner from "../components/shared/spinner";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import ErrorAlert from "../components/ui/errorAlert";
import PageHeader from "../components/layout/pageHeader";
import PageMain from "../components/layout/pageMain";
import { useCurrentUser } from "../lib/auth";
import { useRedirectToLoginIfSignedOut } from "../lib/useRedirectToLoginIfSignedOut";
import { formatCountdown, formatDateRange } from "../lib/eventDates";
import {
  EVENT_SEARCH_MIN_LENGTH,
  bcpRegisterUrl,
  eventStatus,
  searchEvents,
  type EventSearchResult,
} from "../lib/follow";

function ResultCard({ event }: { event: EventSearchResult }) {
  const dates = formatDateRange(event.startDate, event.endDate);
  const status = eventStatus(event);
  const countdown = status === "Upcoming" ? formatCountdown(event.startDate, event.endDate) : undefined;
  return (
    <li>
      <Card className="p-3">
        <div className="text-sm font-medium text-text-primary">{event.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span
            className={
              status === "Underway"
                ? "rounded-sm bg-brass-500/15 px-1.5 py-0.5 font-medium text-brass-400"
                : "rounded-sm bg-surface-2 px-1.5 py-0.5 font-medium text-text-secondary"
            }
          >
            {countdown ?? status}
          </span>
          {dates && <span>{dates}</span>}
          <span>{event.teamEvent ? "Team event" : "Singles"}</span>
          {event.playerCount != null && <span>{event.playerCount} registered</span>}
        </div>
        {event.location && <div className="mt-1 truncate text-xs text-text-tertiary">{event.location}</div>}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href={`/event?event=${encodeURIComponent(event.id)}`}
            className="text-xs font-medium text-brass-400 hover:underline"
          >
            View event →
          </Link>
          {status === "Upcoming" && (
            <a
              href={bcpRegisterUrl(event.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-text-secondary hover:underline"
            >
              Join on BCP<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </Card>
    </li>
  );
}

/**
 * Searches Best Coast Pairings' 40k events by name. The query lives in
 * the URL (`?q=`), so back, refresh and shared links show the same
 * results; each search is one deliberate request, never one per keystroke.
 */
function SearchContent() {
  const { user, checked } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, checked);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const inputId = useId();

  const query = (searchParams.get("q") ?? "").trim();
  const [draft, setDraft] = React.useState(query);
  const [results, setResults] = React.useState<EventSearchResult[] | null>(null);
  const [nextCursor, setNextCursor] = React.useState<string | undefined>();
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [searchedFor, setSearchedFor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const approved = user?.status === "approved";

  // Back/forward changes ?q= without anyone typing.
  const [syncedQuery, setSyncedQuery] = React.useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setDraft(query);
    if (query.length < EVENT_SEARCH_MIN_LENGTH) {
      setResults(null);
      setSearchedFor(null);
      setNextCursor(undefined);
    }
  }

  React.useEffect(() => {
    if (!approved || query.length < EVENT_SEARCH_MIN_LENGTH) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchEvents(query)
      .then((page) => {
        if (cancelled) return;
        setResults(page.results);
        setNextCursor(page.nextCursor);
        setSearchedFor(query);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [approved, query]);

  const loadMore = () => {
    if (!nextCursor || !searchedFor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    searchEvents(searchedFor, nextCursor)
      .then((page) => {
        // BCP's pages can overlap at the boundary.
        setResults((prev) => {
          const seen = new Set((prev ?? []).map((e) => e.id));
          return [...(prev ?? []), ...page.results.filter((e) => !seen.has(e.id))];
        });
        setNextCursor(page.results.length > 0 ? page.nextCursor : undefined);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingMore(false));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = draft.trim();
    if (q.length < EVENT_SEARCH_MIN_LENGTH) return;
    router.push(`${pathname}?q=${encodeURIComponent(q)}`, { scroll: false });
  };

  const tooShort = draft.trim().length < EVENT_SEARCH_MIN_LENGTH;

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title="Find Events" subtitle="Search Warhammer 40,000 events on Best Coast Pairings by name." />
      <PageMain>
        {!checked || !user ? null : !approved ? (
          <AccessStatusMessage status={user.status} />
        ) : (
          <>
            <form onSubmit={submit} className="flex flex-col gap-1.5" role="search">
              <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
                Event name
              </label>
              <div className="flex gap-2">
                <input
                  id={inputId}
                  type="search"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="e.g. Open, GT, your store's name…"
                  autoFocus={!query}
                  enterKeyHint="search"
                  className="min-w-0 flex-1 rounded-md border border-surface-border bg-surface-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brass-500 focus-visible:ring-2 focus-visible:ring-brass-500/40"
                />
                <Button type="submit" variant="primary" disabled={tooShort || loading}>
                  Search
                </Button>
              </div>
              <p className="text-xs text-text-tertiary">
                Covers events from the past two days to two months ahead, soonest first. Type at least {EVENT_SEARCH_MIN_LENGTH}{" "}
                characters; any part of the name matches.
              </p>
            </form>

            {loading && (
              <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-text-secondary">
                <Spinner size="sm" />
                <span>Searching Best Coast Pairings…</span>
              </div>
            )}
            {error && <ErrorAlert>Couldn&apos;t search: {error}</ErrorAlert>}

            {!loading && !error && results && searchedFor && (
              results.length === 0 ? (
                <EmptyState
                  title={`No events match “${searchedFor}”`}
                  message="Try a shorter part of the name. Events that ended more than two days ago or are over two months away aren't included."
                />
              ) : (
                <section aria-label="Search results" className="flex flex-col gap-2">
                  <p className="text-xs text-text-tertiary">
                    {results.length}
                    {nextCursor ? "+" : ""} event{results.length === 1 ? "" : "s"} matching “{searchedFor}”
                  </p>
                  <ul className="flex flex-col gap-2">
                    {results.map((event) => (
                      <ResultCard key={event.id} event={event} />
                    ))}
                  </ul>
                  {nextCursor && (
                    <Button variant="secondary" onClick={loadMore} disabled={loadingMore} className="self-center">
                      {loadingMore ? "Loading…" : "Load more"}
                    </Button>
                  )}
                </section>
              )
            )}
          </>
        )}
      </PageMain>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
