"use client";
import React from "react";

import FriendRow from "../components/myEvents/friendRow";
import AccessStatusMessage from "../components/shared/accessStatusMessage";
import EmptyState from "../components/shared/emptyState";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import ErrorAlert from "../components/ui/errorAlert";
import PageHeader from "../components/layout/pageHeader";
import PageMain from "../components/layout/pageMain";
import { useCurrentUser } from "../lib/auth";
import { useRedirectToLoginIfSignedOut } from "../lib/useRedirectToLoginIfSignedOut";
import {
  acceptFriendRequest,
  declineFriendRequest,
  fetchFriends,
  fetchIncomingFriendRequests,
  removeFriend,
  type Friend,
  type IncomingFriendRequest,
} from "../lib/friends";
import { logClientEvent } from "../lib/clientLog";
import { useToast } from "../components/shared/toastContext";

/**
 * The signed-in account's own friends: incoming requests (accept/
 * decline) and the accepted friends list, each with a lazy "their
 * events" disclosure (see FriendRow) — the actual payoff of friending
 * someone. Sending a new request isn't done from here — see
 * AddFriendButton on app/dossier/[bcpUserId]/page.tsx, the one
 * discovery path this app has (internal/api/friends.go's own doc
 * comment explains why there's no search/browse route).
 */
export default function FriendsPage() {
  const { user, checked } = useCurrentUser();
  const { showToast } = useToast();
  useRedirectToLoginIfSignedOut(user, checked);

  const [requests, setRequests] = React.useState<IncomingFriendRequest[]>([]);
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [respondingTo, setRespondingTo] = React.useState<number | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchIncomingFriendRequests(), fetchFriends()])
      .then(([r, f]) => {
        setRequests(r);
        setFriends(f);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        logClientEvent("error", "friends: loading failed", { error: message });
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (!checked || !user || user.status !== "approved") return;
    load();
  }, [checked, user, load]);

  const respond = async (id: number, name: string, action: "accept" | "decline") => {
    setRespondingTo(id);
    try {
      await (action === "accept" ? acceptFriendRequest(id) : declineFriendRequest(id));
      // Re-fetches both lists rather than patching state locally — an
      // accept changes both (the request disappears, a new friend
      // appears), and this page is never opened often enough for a
      // full reload to be worth avoiding.
      load();
      showToast(action === "accept" ? `You and ${name} are now friends.` : `Declined ${name}'s request.`, "success");
    } catch (err) {
      logClientEvent("warn", `friends: ${action} failed`, {
        error: err instanceof Error ? err.message : String(err),
      });
      showToast(`Couldn't ${action} ${name}'s request — try again.`, "error");
    } finally {
      setRespondingTo(null);
    }
  };

  const handleRemoveFriend = (userId: number) => {
    const name = friends.find((f) => f.userId === userId)?.name ?? "that friend";
    setFriends((prev) => prev.filter((f) => f.userId !== userId));
    removeFriend(userId)
      .then(() => showToast(`Removed ${name} from your friends.`, "info"))
      .catch((err: unknown) => {
        logClientEvent("warn", "friends: removing a friend failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        // Best-effort optimistic removal, same posture as follows sync
        // (app/page.tsx's persistFollowChange) — a failure here just
        // means the removal silently didn't take; re-opening this page
        // later shows the real state either way.
      });
  };

  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader title="Friends" />

      <PageMain>
        {!checked || !user ? null : user.status !== "approved" ? (
          <AccessStatusMessage status={user.status} />
        ) : (
          <div className="flex flex-col gap-4">
            {error && <ErrorAlert>Couldn&apos;t load your friends: {error}</ErrorAlert>}

            {requests.length > 0 && (
              <Card className="p-4">
                <h2 className="text-sm font-semibold text-text-primary">
                  Requests ({requests.length})
                </h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {requests.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-text-secondary">{r.name}</span>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          onClick={() => respond(r.id, r.name, "accept")}
                          disabled={respondingTo === r.id}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => respond(r.id, r.name, "decline")}
                          disabled={respondingTo === r.id}
                        >
                          Decline
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {loading ? (
              <p className="text-sm text-text-secondary">Loading…</p>
            ) : friends.length === 0 ? (
              <EmptyState
                icon={
                  <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                    <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.4" />
                    <path
                      d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 8a2.5 2.5 0 1 1 0-5M20.5 19c0-2.3-1.6-4-3.7-4.7"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                title="Not friends with anyone yet"
                message={"Visit a player's public dossier page and use “Add Friend” there to send a request."}
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {friends.map((f) => (
                  <FriendRow key={f.userId} friend={f} onRemove={handleRemoveFriend} />
                ))}
              </ul>
            )}
          </div>
        )}
      </PageMain>
    </div>
  );
}
