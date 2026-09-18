"use client";
import { useState } from "react";
import Link from "next/link";
import { fetchFriendEvents, type Friend } from "../../lib/friends";
import type { MyEvent } from "../../lib/myEvents";
import { logClientEvent } from "../../lib/clientLog";
import Button from "../ui/button";
import Spinner from "../shared/spinner";

type EventsState = { loading: boolean; error: string | null; present: MyEvent[]; future: MyEvent[] } | null;

function EventLine({ event }: { event: MyEvent }) {
  return (
    <li className="truncate text-xs text-text-secondary">
      {event.eventName}
      {event.startDate && <span className="text-text-tertiary"> · {event.startDate}</span>}
    </li>
  );
}

/**
 * One row in the /friends page's friends list: name, a link to their
 * public dossier (when they've linked a BCP profile), an unfriend
 * button, and — the actual point of friending someone — a lazy "Their
 * events" disclosure that calls fetchFriendEvents on first expand
 * rather than every friend's events loading unasked-for the moment the
 * page opens (same "fetch only what's needed" reasoning as every other
 * lazy fetch in this app).
 */
export default function FriendRow({ friend, onRemove }: { friend: Friend; onRemove: (userId: number) => void }) {
  const [events, setEvents] = useState<EventsState>(null);
  const [removing, setRemoving] = useState(false);

  const toggleEvents = () => {
    if (events) {
      setEvents(null);
      return;
    }
    if (!friend.bcpUserId) return;
    setEvents({ loading: true, error: null, present: [], future: [] });
    fetchFriendEvents(friend.bcpUserId)
      .then((data) => {
        setEvents({ loading: false, error: null, present: data.present, future: data.future });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setEvents({ loading: false, error: message, present: [], future: [] });
        logClientEvent("warn", "friends: loading a friend's events failed", { error: message });
      });
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      onRemove(friend.userId);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <li className="rounded-lg border border-surface-border bg-surface-1 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{friend.name}</p>
          {friend.bcpUserId && (
            <Link href={`/dossier/${encodeURIComponent(friend.bcpUserId)}`} className="text-xs text-brass-400 hover:underline">
              View dossier
            </Link>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {friend.bcpUserId && (
            <Button variant="ghost" size="sm" onClick={toggleEvents}>
              {events ? "Hide events" : "Their events"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleRemove} disabled={removing}>
            Remove
          </Button>
        </div>
      </div>

      {events && (
        <div className="mt-2 border-t border-surface-border pt-2">
          {events.loading ? (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Spinner size="sm" />
              <span>Loading their events…</span>
            </div>
          ) : events.error ? (
            <p className="text-xs text-danger-400">Couldn&apos;t load their events — try again.</p>
          ) : events.present.length === 0 && events.future.length === 0 ? (
            <p className="text-xs text-text-tertiary">No upcoming events published for them yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {[...events.present, ...events.future].map((event) => (
                <EventLine key={event.eventId} event={event} />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
