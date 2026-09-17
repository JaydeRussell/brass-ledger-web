"use client";
import React from "react";

import FriendRow from "../components/myEvents/friendRow";
import AccessStatusMessage from "../components/shared/accessStatusMessage";
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

  const respond = async (id: number, action: "accept" | "decline") => {
    setRespondingTo(id);
    try {
      await (action === "accept" ? acceptFriendRequest(id) : declineFriendRequest(id));
      // Re-fetches both lists rather than patching state locally — an
      // accept changes both (the request disappears, a new friend
      // appears), and this page is never opened often enough for a
      // full reload to be worth avoiding.
      load();
    } catch (err) {
      logClientEvent("warn", `friends: ${action} failed`, {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const handleRemoveFriend = (userId: number) => {
    setFriends((prev) => prev.filter((f) => f.userId !== userId));
    removeFriend(userId).catch((err: unknown) => {
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
                        <Button size="sm" onClick={() => respond(r.id, "accept")} disabled={respondingTo === r.id}>
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => respond(r.id, "decline")}
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
              <Card className="p-4">
                <p className="text-sm text-text-secondary">
                  Not friends with anyone yet. Visit a player&apos;s public dossier page and use
                  &ldquo;Add Friend&rdquo; there to send a request.
                </p>
              </Card>
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
