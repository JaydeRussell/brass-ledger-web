// Client for follow links, spectated events and event search (see
// internal/api/follow.go and search.go in the brass-ledger-api repo).

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** A response that wasn't ok, keeping its status for callers that branch on 404. */
export class FollowRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_API_BASE}${path}`, { credentials: "include", cache: "no-store", ...init });
  const text = await res.text();
  if (!res.ok) {
    let message = `Request failed: HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // Body wasn't JSON — keep the generic message above.
    }
    throw new FollowRequestError(message, res.status);
  }
  return (text.length === 0 ? null : JSON.parse(text)) as T;
}

/** Null on a 404, which every lookup here uses for "there isn't one". */
async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof FollowRequestError && err.status === 404) return null;
    throw err;
  }
}

export type FollowLink = { token: string; expiresAt: string };

/** The page a follow link opens. */
export function followLinkUrl(token: string): string {
  return `${window.location.origin}/follow/${encodeURIComponent(token)}`;
}

/** The signed-in player's live link for this event, or null. */
export function fetchMyFollowLink(eventId: string): Promise<FollowLink | null> {
  return orNull(request<FollowLink>(`/api/events/${encodeURIComponent(eventId)}/follow-link`));
}

/** Creates the signed-in player's link for this event, or returns the existing one. */
export function createFollowLink(eventId: string): Promise<FollowLink> {
  return request<FollowLink>(`/api/events/${encodeURIComponent(eventId)}/follow-link`, { method: "PUT" });
}

/** Turns the link off. Anyone who saved it loses the event from Spectating. */
export async function deleteFollowLink(eventId: string): Promise<void> {
  await request<null>(`/api/events/${encodeURIComponent(eventId)}/follow-link`, { method: "DELETE" });
}

export type ResolvedFollowLink = { eventId: string; playerId: string };

/** What a link shows, or null when it has expired or been turned off. Needs no sign-in. */
export function resolveFollowLink(token: string): Promise<ResolvedFollowLink | null> {
  return orNull(request<ResolvedFollowLink>(`/api/follow/${encodeURIComponent(token)}`));
}

export type SpectatedEvent = {
  eventId: string;
  eventName: string;
  startDate?: string;
  endDate?: string;
  teamEvent: boolean;
  started: boolean;
  ended: boolean;
  playerId: string;
  playerName: string;
  viaLink: boolean;
};

export type SpectatingList = { now: SpectatedEvent[]; upcoming: SpectatedEvent[] };

export function fetchSpectating(): Promise<SpectatingList> {
  return request<SpectatingList>("/api/me/spectating");
}

/** Who the signed-in user follows in this event, or null. */
export async function fetchSpectatingFor(eventId: string): Promise<string | null> {
  const body = await orNull(request<{ playerId: string }>(`/api/me/spectating/${encodeURIComponent(eventId)}`));
  return body?.playerId ?? null;
}

/**
 * Saves an event to the signed-in user's Spectating tab, from a link or
 * from picking a player. `saved` is false when the event is already theirs.
 */
export function saveSpectating(
  target: { token: string } | { eventId: string; playerId: string }
): Promise<{ saved: boolean }> {
  return request<{ saved: boolean }>("/api/me/spectating", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(target),
  });
}

export async function removeSpectating(eventId: string): Promise<void> {
  await request<null>(`/api/me/spectating/${encodeURIComponent(eventId)}`, { method: "DELETE" });
}

export type EventSearchResult = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  playerCount?: number;
  /** Ticket limit; only sent for singles events that have one. */
  capacity?: number;
  /** From the search's centre to the venue; only on a location search. */
  distanceMiles?: number;
  teamEvent: boolean;
  started: boolean;
  ended: boolean;
};

export type EventStatus = "Underway" | "Upcoming" | "Finished" | "Not started";

/** The last moment of the event's final day, or null if BCP gave no usable date. */
function lastDay(event: Pick<EventSearchResult, "startDate" | "endDate">): Date | null {
  const raw = event.endDate || event.startDate;
  if (!raw) return null;
  const day = new Date(raw.slice(0, 10) + "T23:59:59");
  return Number.isNaN(day.getTime()) ? null : day;
}

/**
 * Where an event stands. "Not started" is one whose dates have passed
 * without BCP ever marking it started, usually because it never ran.
 */
export function eventStatus(
  event: Pick<EventSearchResult, "started" | "ended" | "startDate" | "endDate">,
  now: Date = new Date()
): EventStatus {
  if (event.ended) return "Finished";
  if (event.started) return "Underway";
  const last = lastDay(event);
  return last && last < now ? "Not started" : "Upcoming";
}

/**
 * "28 of 40 registered · 12 left", "Full · 40 of 40", or "28 registered"
 * when there's no limit to compare against. Undefined when the organiser
 * hides the count.
 */
export function registrationText(event: Pick<EventSearchResult, "playerCount" | "capacity">): string | undefined {
  const { playerCount, capacity } = event;
  if (playerCount == null) return undefined;
  if (capacity == null) return `${playerCount} registered`;
  const left = capacity - playerCount;
  return left <= 0 ? `Full · ${playerCount} of ${capacity}` : `${playerCount} of ${capacity} registered · ${left} left`;
}

/**
 * "11 mi (18 km) from Denver" for a typed place, or "About 11 mi (18 km)
 * away" from the device, whose location was rounded to about 10 km.
 */
export function distanceText(miles: number, fromPlace?: string): string {
  const both = `${miles} mi (${Math.round(miles * 1.609)} km)`;
  if (!fromPlace) return `About ${both} away`;
  const short = fromPlace.split(",")[0].trim() || fromPlace;
  return `${both} from ${short}`;
}

/** The shortest search worth sending. */
export const EVENT_SEARCH_MIN_LENGTH = 3;

export type EventSearchPage = { results: EventSearchResult[]; nextCursor?: string };

/** The radii a location search offers, in miles. */
export const SEARCH_RADII_MILES = [25, 50, 100, 250] as const;

export type EventSearchFilters = {
  /** Part of an event's name; may be empty when `near` is set. */
  q?: string;
  near?: { lat: number; lon: number; radiusMiles: number };
  /** YYYY-MM-DD. Empty means two days ago to two months ahead. */
  from?: string;
  to?: string;
};

/**
 * One page of 40k events matching `filters`, in date order. Pass a page's
 * `nextCursor` for the next. Location goes in the request only, never in
 * the page's own URL.
 */
export async function searchEvents(filters: EventSearchFilters, cursor?: string): Promise<EventSearchPage> {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.near) {
    params.set("lat", String(filters.near.lat));
    params.set("lon", String(filters.near.lon));
    params.set("radius", String(filters.near.radiusMiles));
  }
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (cursor) params.set("cursor", cursor);
  const body = await request<EventSearchPage | EventSearchResult[]>(`/api/event-search?${params.toString()}`);
  // A backend without paging answers with a bare list.
  return Array.isArray(body) ? { results: body } : body;
}

export type Place = { name: string; lat: number; lon: number };

/** Up to five places matching a typed name, looked up through OpenStreetMap by the backend. */
export function lookupPlace(name: string): Promise<Place[]> {
  return request<Place[]>(`/api/places?q=${encodeURIComponent(name.trim())}`);
}

/** Coordinates rounded to one decimal place (about 10 km), for sending a device's location. */
export function coarsen(value: number): number {
  return Math.round(value * 10) / 10;
}

/** BCP's event page, where registration happens. */
export function bcpRegisterUrl(eventId: string): string {
  return `https://www.bestcoastpairings.com/event/${encodeURIComponent(eventId)}`;
}
