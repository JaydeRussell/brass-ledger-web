"use client";
import type { ItcRanking, MyPairing, TeamBoardMatchup } from "../../lib/bcp";
import MyRoundCard from "../pairings/myRoundCard";
import Card from "../ui/card";

// The signed-in account's own current-round pairing — see myRoundCard.tsx.
// Absent (undefined/null) whenever there's nothing to auto-detect (no
// linked BCP profile, not on this event's roster, or the event hasn't
// started), in which case the panel shows `emptyMessage` instead.
export type MyRoundSummary = {
  // Threaded straight into MyRoundCard's own eventId prop — see its doc
  // comment (scopes RoundNotes' private per-round notes to this event).
  eventId: string;
  round: number;
  loading: boolean;
  error: string | null;
  pairing: MyPairing | null;
  board: TeamBoardMatchup | null;
  myBcpUserId?: string;
  players: Player[];
  myTeamPlayerId?: string;
  // Threaded straight into MyRoundCard's own isTeamEvent prop — see its
  // doc comment for why this gate matters (team events never get the
  // singles-only mission-matchup panel).
  isTeamEvent: boolean;
  rosterByTeamId?: Map<string, Player[]>;
  itcLeagueId?: string | null;
  itcByUserId?: Record<string, ItcRanking | null>;
  onRefresh?: () => void;
  refreshing?: boolean;
  lastSyncedAt?: number | null;
};

type MinePanelProps = {
  myRound?: MyRoundSummary | null;
  // Why there's no "Your round" to show, when `myRound` is absent.
  emptyMessage: string;
};

/**
 * The "Mine" tab: your own current-round pairing, auto-detected via a
 * linked BCP profile.
 */
export default function MinePanel({ myRound, emptyMessage }: MinePanelProps) {
  if (!myRound) {
    return (
      <Card className="p-4 shadow-sm">
        <p className="font-semibold text-text-primary">Your round</p>
        <p className="mt-1 text-sm text-text-secondary">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <MyRoundCard
      loading={myRound.loading}
      error={myRound.error}
      eventId={myRound.eventId}
      round={myRound.round}
      pairing={myRound.pairing}
      board={myRound.board}
      myBcpUserId={myRound.myBcpUserId}
      players={myRound.players}
      myTeamPlayerId={myRound.myTeamPlayerId}
      isTeamEvent={myRound.isTeamEvent}
      rosterByTeamId={myRound.rosterByTeamId}
      itcLeagueId={myRound.itcLeagueId}
      itcByUserId={myRound.itcByUserId}
      onRefresh={myRound.onRefresh}
      refreshing={myRound.refreshing}
      lastSyncedAt={myRound.lastSyncedAt}
    />
  );
}
