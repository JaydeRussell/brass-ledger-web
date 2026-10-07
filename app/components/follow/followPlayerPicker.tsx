"use client";
import { useId, useState } from "react";

import Button from "../ui/button";
import Card from "../ui/card";
import { sortPlayers } from "../../lib/rosterSort";

type FollowPlayerPickerProps = {
  players: Player[];
  teamEvent: boolean;
  onFollow: (playerId: string) => Promise<void>;
};

/**
 * For a signed-in viewer who isn't playing: pick someone on the roster to
 * see the event from their side. In a team event that also shows their
 * team. The choice is saved to the viewer's Spectating tab.
 */
export default function FollowPlayerPicker({ players, teamEvent, onFollow }: FollowPlayerPickerProps) {
  const selectId = useId();
  const [picked, setPicked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const follow = async () => {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      await onFollow(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't follow that player.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4 shadow-sm">
      <p className="font-semibold text-text-primary">Follow a player</p>
      <p className="mt-1 text-sm text-text-secondary">
        Not playing? Pick someone to see their rounds{teamEvent ? " and their team" : ""} here. It&apos;s saved to the
        Spectating tab on My Events.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          Player to follow
        </label>
        <select
          id={selectId}
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-surface-border bg-surface-1 px-2 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60"
        >
          <option value="">Choose a player…</option>
          {sortPlayers(players, "name").map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.team ? `${p.name} (${p.team})` : p.name}
            </option>
          ))}
        </select>
        <Button variant="primary" size="sm" onClick={follow} disabled={!picked || busy}>
          Follow
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger-400">{error}</p>}
    </Card>
  );
}
