"use client";
import type { ItcRanking } from "../../lib/bcp";
import TeamRosterList from "./teamRosterList";

type TeamRosterFallbackProps = {
  side1Name: string;
  side1Players: Player[];
  side2Name: string;
  side2Players: Player[];
  itcByUserId?: Record<string, ItcRanking | null>;
  itcLeagueId?: string | null;
};

/**
 * Shown in place of individual board matchups when BCP has published a
 * team-vs-team pairing but not yet the board-by-board assignments within
 * it — still just a display of each side's already-published roster (the
 * same list the Roster tab shows), not a guess at who plays whom.
 */
export default function TeamRosterFallback({
  side1Name,
  side1Players,
  side2Name,
  side2Players,
  itcByUserId,
  itcLeagueId,
}: TeamRosterFallbackProps) {
  return (
    <div className="grid grid-cols-2 gap-2 px-1 py-1 sm:gap-3">
      <TeamRosterList name={side1Name} players={side1Players} itcByUserId={itcByUserId} itcLeagueId={itcLeagueId} />
      <TeamRosterList name={side2Name} players={side2Players} itcByUserId={itcByUserId} itcLeagueId={itcLeagueId} />
    </div>
  );
}
