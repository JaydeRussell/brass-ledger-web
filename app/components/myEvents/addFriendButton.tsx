"use client";
import { useEffect, useState } from "react";
import { fetchFriends, sendFriendRequest } from "../../lib/friends";
import { logClientEvent } from "../../lib/clientLog";

type Status = "checking" | "not-friends" | "already-friends" | "sending" | "sent" | "error";

/**
 * "Add Friend" on a signed-in viewer's own dossier-page visit to someone
 * else's dossier — the one discovery path friending has (see
 * internal/api/friends.go's own doc comment: no search/browse route,
 * sending a request always starts from a bcpUserId already in hand).
 *
 * Checks fetchFriends() on mount to decide whether to show "Add Friend"
 * or "Friends ✓" — there's no dedicated "am I already friends with
 * bcpUserId X" endpoint, so this reuses the full accepted-friends list,
 * cheap at this app's scale. It can NOT tell "never requested" apart
 * from "I already sent a request that's still pending" (no "my
 * outgoing requests" endpoint exists yet) — a stale reload after
 * sending one will show "Add Friend" again, and clicking it a second
 * time gets the backend's 409 back, handled below by treating that
 * exactly like "sent" rather than surfacing it as a failure.
 */
export default function AddFriendButton({ bcpUserId }: { bcpUserId: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFriends()
      .then((friends) => {
        if (cancelled) return;
        setStatus(friends.some((f) => f.bcpUserId === bcpUserId) ? "already-friends" : "not-friends");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Can't tell friend status — fail toward showing nothing rather
        // than a button that might duplicate an existing friendship.
        logClientEvent("warn", "add friend: checking friend status failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [bcpUserId]);

  const handleClick = async () => {
    setStatus("sending");
    setError(null);
    try {
      await sendFriendRequest(bcpUserId);
      setStatus("sent");
      logClientEvent("info", "add friend: request sent", { bcpUserId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // A 409 (already exists) reads the same as success from here —
      // see this component's own doc comment.
      if (message.includes("already exists")) {
        setStatus("sent");
        return;
      }
      setStatus("not-friends");
      setError(message);
      logClientEvent("warn", "add friend: sending request failed", { error: message });
    }
  };

  if (status === "checking") return null;
  if (status === "already-friends") {
    return <span className="text-xs font-medium text-brass-400">Friends ✓</span>;
  }
  if (status === "sent") {
    return <span className="text-xs text-text-tertiary">Request sent</span>;
  }
  if (status === "error") return null;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "sending"}
        className="rounded-md border border-surface-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Add Friend"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
}
