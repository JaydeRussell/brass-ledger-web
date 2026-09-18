// Client for this app's own backend's mutual-friending endpoints (see
// internal/api/friends.go in the brass-ledger-api repo): sending/
// accepting/declining friend requests, the accepted-friends list, and a
// friend's own events. Same credentials/error-decoding shape as
// myStats.ts/follows.ts — duplicated here rather than shared, matching
// this app's established app/lib/*.ts convention.

import type { MyEvents } from "./myEvents";

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

async function handleJSONResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = `Request failed: HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // Body wasn't JSON — keep the generic message above.
    }
    throw new Error(message);
  }
  if (text.length === 0) return null as T;
  return JSON.parse(text) as T;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_API_BASE}${path}`, { credentials: "include" });
  return handleJSONResponse<T>(res);
}

/** An incoming (pending, addressed to the signed-in account) friend
 * request — see internal/api/friends.go's friendRequestResponse. */
export type IncomingFriendRequest = {
  id: number;
  requesterId: number;
  name: string;
  createdAt: string;
};

/** One accepted friendship, from the signed-in account's own point of
 * view — see internal/api/friends.go's friendResponse. bcpUserId is ""
 * for a friend who hasn't linked a BCP profile (rare in practice, since
 * discovery starts from their dossier page, but not impossible if they
 * unlink afterward). */
export type Friend = {
  userId: number;
  name: string;
  bcpUserId: string;
};

/**
 * Sends a friend request to whoever has linked recipientBcpUserId.
 * Throws (with the backend's own message) for an unknown bcpUserId
 * (404), a request to yourself (400), or a request that already exists
 * in this direction (409) — the caller (AddFriendButton) surfaces
 * whichever of these actually happened rather than a generic failure.
 */
export async function sendFriendRequest(recipientBcpUserId: string): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/friends/requests`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientBcpUserId }),
  });
  await handleJSONResponse(res);
}

/** The signed-in account's own pending incoming friend requests. */
export async function fetchIncomingFriendRequests(): Promise<IncomingFriendRequest[]> {
  return getJSON<IncomingFriendRequest[]>("/api/friends/requests");
}

/** Accepts a pending incoming request by its id. */
export async function acceptFriendRequest(id: number): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/friends/requests/${id}/accept`, {
    method: "POST",
    credentials: "include",
  });
  await handleJSONResponse(res);
}

/** Declines a pending incoming request by its id. */
export async function declineFriendRequest(id: number): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/friends/requests/${id}/decline`, {
    method: "POST",
    credentials: "include",
  });
  await handleJSONResponse(res);
}

/** The signed-in account's own accepted friends. */
export async function fetchFriends(): Promise<Friend[]> {
  return getJSON<Friend[]>("/api/friends");
}

/** Ends a friendship — friendUserId is the other account's internal id
 * (Friend.userId from fetchFriends), not a friend-request id. */
export async function removeFriend(friendUserId: number): Promise<void> {
  const res = await fetch(`${BACKEND_API_BASE}/api/friends/${friendUserId}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleJSONResponse(res);
}

/**
 * A friend's own past/present/future events (see myEvents.ts's
 * MyEvents) — the actual payoff of friending someone. Throws a 404-
 * derived error for a bcpUserId that isn't (yet, or no longer) an
 * accepted friend's, same as any other not-ok response.
 */
export async function fetchFriendEvents(bcpUserId: string): Promise<MyEvents> {
  return getJSON<MyEvents>(`/api/friends/${encodeURIComponent(bcpUserId)}/events`);
}
