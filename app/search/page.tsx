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
  SEARCH_RADII_MILES,
  bcpRegisterUrl,
  distanceText,
  eventStatus,
  registrationText,
  searchEvents,
  type EventSearchFilters,
  type EventSearchResult,
} from "../lib/follow";
import LocationFilter, { type SearchLocation } from "../components/search/locationFilter";

function ResultCard({ event, distance }: { event: EventSearchResult; distance?: string }) {
  const dates = formatDateRange(event.startDate, event.endDate);
  const status = eventStatus(event);
  const countdown = status === "Upcoming" ? formatCountdown(event.startDate, event.endDate) : undefined;
  const registration = registrationText(event);
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
          {registration && <span>{registration}</span>}
        </div>
        {(distance || event.location) && (
          <div className="mt-1 truncate text-xs text-text-tertiary">
            {distance && <span className="font-medium text-text-secondary">{distance}</span>}
            {distance && event.location && " · "}
            {event.location}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href={`/event?event=${encodeURIComponent(event.id)}`}
            className="inline-flex items-center min-h-6 text-xs font-medium text-brass-400 hover:underline"
          >
            View event →
          </Link>
          {status === "Upcoming" && (
            <a
              href={bcpRegisterUrl(event.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-6 text-xs font-medium text-text-secondary hover:underline"
            >
              Join on BCP<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </Card>
    </li>
  );
}

const DEFAULT_RADIUS = 50;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The filters a search ran with: name, dates and radius from the URL, location from the page. */
type Applied = { q: string; from: string; to: string; radius: number; location: SearchLocation | null };

function readUrl(params: URLSearchParams) {
  const radius = Number(params.get("radius"));
  const date = (key: string) => {
    const v = params.get(key) ?? "";
    return DATE_RE.test(v) ? v : "";
  };
  return {
    q: (params.get("q") ?? "").trim(),
    from: date("from"),
    to: date("to"),
    radius: (SEARCH_RADII_MILES as readonly number[]).includes(radius) ? radius : DEFAULT_RADIUS,
  };
}

function toFilters(a: Applied): EventSearchFilters {
  return {
    q: a.q,
    from: a.from || undefined,
    to: a.to || undefined,
    near: a.location ? { lat: a.location.lat, lon: a.location.lon, radiusMiles: a.radius } : undefined,
  };
}

/** A search needs a name long enough to send, or a location. */
function searchable(q: string, location: SearchLocation | null): boolean {
  return q.trim().length >= EVENT_SEARCH_MIN_LENGTH || location !== null;
}

/**
 * Finds Best Coast Pairings' 40k events by name, location and dates, a
 * page at a time. Name, dates and radius live in the URL so back, refresh
 * and shared links keep them; the location never goes in the URL. Each
 * search is one deliberate request.
 */
function SearchContent() {
  const { user, checked } = useCurrentUser();
  useRedirectToLoginIfSignedOut(user, checked);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const nameId = useId();
  const fromId = useId();
  const toId = useId();

  const url = readUrl(searchParams);
  const urlKey = searchParams.toString();
  const [draft, setDraft] = React.useState(() => ({ q: url.q, from: url.from, to: url.to, radius: url.radius }));
  const [location, setLocation] = React.useState<SearchLocation | null>(null);
  const [applied, setApplied] = React.useState<Applied | null>(() =>
    searchable(url.q, null) ? { ...url, location: null } : null
  );
  const [results, setResults] = React.useState<EventSearchResult[] | null>(null);
  const [nextCursor, setNextCursor] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const approved = user?.status === "approved";

  // Back/forward changes the URL without anyone touching the form.
  const [syncedUrl, setSyncedUrl] = React.useState(urlKey);
  if (urlKey !== syncedUrl) {
    setSyncedUrl(urlKey);
    setDraft({ q: url.q, from: url.from, to: url.to, radius: url.radius });
    setApplied(searchable(url.q, location) ? { ...url, location } : null);
    if (!searchable(url.q, location)) {
      setResults(null);
      setNextCursor(undefined);
    }
  }

  // Bumped by each new search, so a Load more page that arrives after the
  // search changed is dropped rather than appended to the wrong results.
  const searchGeneration = React.useRef(0);

  const appliedKey = applied ? JSON.stringify(applied) : "";
  React.useEffect(() => {
    if (!approved || !applied) return;
    let cancelled = false;
    searchGeneration.current += 1;
    setLoadingMore(false);
    setLoading(true);
    setError(null);
    searchEvents(toFilters(applied))
      .then((page) => {
        if (cancelled) return;
        setResults(page.results);
        setNextCursor(page.nextCursor);
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
    // appliedKey stands in for applied, which is a new object each time it's set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved, appliedKey]);

  const loadMore = () => {
    if (!nextCursor || !applied || loadingMore) return;
    const generation = searchGeneration.current;
    const current = () => generation === searchGeneration.current;
    setLoadingMore(true);
    setError(null);
    searchEvents(toFilters(applied), nextCursor)
      .then((page) => {
        if (!current()) return;
        // BCP's pages can overlap at the boundary.
        setResults((prev) => {
          const seen = new Set((prev ?? []).map((e) => e.id));
          return [...(prev ?? []), ...page.results.filter((e) => !seen.has(e.id))];
        });
        setNextCursor(page.results.length > 0 ? page.nextCursor : undefined);
      })
      .catch((err: unknown) => {
        if (current()) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (current()) setLoadingMore(false);
      });
  };

  const datesValid = !draft.from || !draft.to || draft.to >= draft.from;
  const canSearch = searchable(draft.q, location) && datesValid && !loading;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSearch) return;
    const next: Applied = { q: draft.q.trim(), from: draft.from, to: draft.to, radius: draft.radius, location };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    if (location && next.radius !== DEFAULT_RADIUS) params.set("radius", String(next.radius));
    const query = params.toString();
    setSyncedUrl(query);
    setApplied(next);
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const inputClass =
    "min-w-0 rounded-md border border-surface-border bg-surface-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brass-500 focus-visible:ring-2 focus-visible:ring-brass-500/40";

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title="Find Events" subtitle="Search Warhammer 40,000 events on Best Coast Pairings." />
      <PageMain>
        {!checked || !user ? null : !approved ? (
          <AccessStatusMessage status={user.status} />
        ) : (
          <>
            <form onSubmit={submit} className="flex flex-col gap-4" role="search">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={nameId} className="text-xs font-medium text-text-secondary">
                  Event name <span className="text-text-tertiary">(optional with a location)</span>
                </label>
                <input
                  id={nameId}
                  type="search"
                  value={draft.q}
                  onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                  placeholder="e.g. Open, GT, your store's name…"
                  enterKeyHint="search"
                  className={inputClass}
                />
              </div>

              <LocationFilter
                location={location}
                onLocationChange={setLocation}
                radiusMiles={draft.radius}
                onRadiusChange={(radius) => setDraft((d) => ({ ...d, radius }))}
              />

              <fieldset className="flex min-w-0 flex-col gap-1.5">
                <legend className="text-xs font-medium text-text-secondary">Dates</legend>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                  <label htmlFor={fromId}>From</label>
                  <input
                    id={fromId}
                    type="date"
                    value={draft.from}
                    onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                    className={inputClass}
                  />
                  <label htmlFor={toId}>to</label>
                  <input
                    id={toId}
                    type="date"
                    value={draft.to}
                    min={draft.from || undefined}
                    onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                    className={inputClass}
                  />
                  {(draft.from || draft.to) && (
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, from: "", to: "" }))}
                      className="inline-flex min-h-6 items-center px-1 text-text-tertiary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-tertiary">
                  {datesValid
                    ? "Leave blank for the past two days to two months ahead."
                    : "The end date is before the start date."}
                </p>
              </fieldset>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" variant="primary" disabled={!canSearch}>
                  Search
                </Button>
                {!searchable(draft.q, location) && (
                  <span className="text-xs text-text-tertiary">
                    Add at least {EVENT_SEARCH_MIN_LENGTH} characters of a name, or a location.
                  </span>
                )}
              </div>
            </form>

            {loading && (
              <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-text-secondary">
                <Spinner size="sm" />
                <span>Searching Best Coast Pairings…</span>
              </div>
            )}
            {error && <ErrorAlert>Couldn&apos;t search: {error}</ErrorAlert>}

            {!loading && !error && results && applied &&
              (results.length === 0 ? (
                <EmptyState
                  title="No events match"
                  message="Try a wider radius, other dates, or a shorter part of the name."
                />
              ) : (
                <section aria-label="Search results" className="flex flex-col gap-2">
                  <p className="text-xs text-text-tertiary">
                    {results.length}
                    {nextCursor ? "+" : ""} event{results.length === 1 ? "" : "s"}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {results.map((event) => (
                      <ResultCard
                        key={event.id}
                        event={event}
                        distance={
                          event.distanceMiles != null && applied.location
                            ? distanceText(
                                event.distanceMiles,
                                applied.location.kind === "place" ? applied.location.name : undefined
                              )
                            : undefined
                        }
                      />
                    ))}
                  </ul>
                  {nextCursor && (
                    <Button variant="secondary" onClick={loadMore} disabled={loadingMore} className="self-center">
                      {loadingMore ? "Loading…" : "Load more"}
                    </Button>
                  )}
                </section>
              ))}
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
