"use client";
import Link from "next/link";

type PlayerStatsLinkProps = {
  name: string;
  // Only a BCP global (cross-event) account id can be looked up on
  // /players/[bcpUserId] — when this is missing (an event-scoped player
  // id doesn't resolve to one, e.g. a team-event placings row, which is
  // a team rather than a person) this renders as plain, unlinked text.
  bcpUserId?: string;
  className?: string;
};

/**
 * Wraps a player's name in a link to their stats page
 * (/players/[bcpUserId]) wherever the name is already shown — roster
 * cards, pairings rows/boards, placings rows — the same bcpUserId each
 * of those already threads through to ItcBadge. `name` rides along as
 * a one-shot `?name=` query param so the stats page has something to
 * title itself with immediately, without a second fetch.
 */
export default function PlayerStatsLink({ name, bcpUserId, className }: PlayerStatsLinkProps) {
  if (!bcpUserId) return <>{name}</>;

  return (
    <Link
      href={`/players/${encodeURIComponent(bcpUserId)}?name=${encodeURIComponent(name)}`}
      onClick={(e) => e.stopPropagation()}
      className={className ?? "hover:underline"}
    >
      {name}
    </Link>
  );
}
