"use client";
import ArmyListLink from "./armyListLink";
import DispositionBadge from "./dispositionBadge";

type PlayerFactionDetailsProps = {
  bcpUserId?: string;
  players?: Player[];
};

/** Faction (plus disposition badge and a list link, when BCP has them)
 * for whichever player a pairing row is showing — looked up from the
 * already-fetched roster by bcpUserId, not a new fetch.
 * Renders nothing when the roster doesn't have a match (e.g. still
 * loading, or a player with no linked BCP account). */
export default function PlayerFactionDetails({ bcpUserId, players }: PlayerFactionDetailsProps) {
  const player = bcpUserId ? players?.find((p) => p.bcpUserId === bcpUserId) : undefined;
  if (!player) return null;

  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-xs text-text-tertiary">
      {player.faction && <span className="truncate">({player.faction})</span>}
      <DispositionBadge disposition={player.disposition} />
      {player.list && <ArmyListLink href={player.list} playerName={player.name} />}
    </span>
  );
}
