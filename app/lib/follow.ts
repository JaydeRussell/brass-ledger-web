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
  teamEvent: boolean;
  started: boolean;
  ended: boolean;
};

/** The shortest search worth sending. */
export const EVENT_SEARCH_MIN_LENGTH = 3;

/** 40k events from a week ago to two months ahead whose name contains `query`. */
export function searchEvents(query: string): Promise<EventSearchResult[]> {
  return request<EventSearchResult[]>(`/api/event-search?q=${encodeURIComponent(query.trim())}`);
}

/** BCP's event page, where registration happens. */
export function bcpRegisterUrl(eventId: string): string {
  return `https://www.bestcoastpairings.com/event/${encodeURIComponent(eventId)}`;
}
