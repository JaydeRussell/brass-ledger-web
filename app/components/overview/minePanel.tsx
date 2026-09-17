"use client";
import type { ItcRanking, MyPairing, TeamBoardMatchup } from "../../lib/bcp";
import MyRoundCard from "../pairings/myRoundCard";
import TeamItcComparison from "../shared/teamItcComparison";
import Card from "../ui/card";
import Button from "../ui/button";

export type FollowedSummary = {
  label: string;
  pairings: MyPairing[];
  // The followed team's own BCP teamPlayer id, set only when this entry
  // is a followed team (not an individual player) — paired with
  // rosterByTeamId/itcByUserId below to show a neutral avg-ITC
  // comparison against its latest pairing's opponent (roadmap #4).
  teamPlayerId?: string;
};

// The signed-in account's own current-round pairing — see myRoundCard.tsx.
// Absent (undefined/null) whenever there's nothing to auto-detect (signed
// out, no linked BCP profile, not on this event's roster, or the event
// hasn't started), in which case this panel just skips straight to
// following.
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
};

type MinePanelProps = {
  myRound?: MyRoundSummary | null;
  following: FollowedSummary[];
  rosterByTeamId?: Map<string, Player[]>;
  itcByUserId?: Record<string, ItcRanking | null>;
  onGoToRoster: () => void;
  onGoToPairings: () => void;
};

/**
 * The "Mine" tab: your own current-round pairing (auto-detected via a
 * linked BCP profile) plus a quick glance at whoever you're following,
 * each linking into the full Pairings tab for round-by-round detail.
 * Split out of what used to be the Overview tab once event facts, this,
 * and the singles-only "Your team" panel (now its own Team tab — see
 * myTeamPanel.tsx) made that one tab too crowded to skim.
 */
export default function MinePanel({
  myRound,
  following,
  rosterByTeamId,
  itcByUserId,
  onGoToRoster,
  onGoToPairings,
}: MinePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {myRound && (
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
        />
      )}

      {following.length === 0 ? (
        <Card className="p-4 shadow-sm">
          <p className="font-semibold text-text-primary">Not following anyone</p>
          <p className="mt-1 text-sm text-text-secondary">
            Head to the Roster tab and hit &quot;Follow&quot; on any team or player — you can
            follow as many as you like.
          </p>
          <Button variant="ghost" size="sm" className="mt-2 -ml-2.5" onClick={onGoToRoster}>
            Go to Roster →
          </Button>
        </Card>
      ) : (
        following.map((entry) => {
          const latestPairing = [...entry.pairings].reverse().find((p) => p.published);
          const myRoster = entry.teamPlayerId ? rosterByTeamId?.get(entry.teamPlayerId) : undefined;
          const opponentRoster = latestPairing?.opponentTeamPlayerId
            ? rosterByTeamId?.get(latestPairing.opponentTeamPlayerId)
            : undefined;
          return (
            <Card key={entry.label} className="p-4 shadow-sm">
              <p className="font-semibold text-text-primary">Following {entry.label}</p>
              {latestPairing ? (
                <p className="mt-1 text-sm text-text-secondary">
                  Round {latestPairing.round}: vs {latestPairing.opponentName}
                  {latestPairing.table && ` (table ${latestPairing.table})`}
                </p>
              ) : (
                <p className="mt-1 text-sm text-text-secondary">No pairings published yet.</p>
              )}
              {latestPairing?.opponentTeamPlayerId &&
              itcByUserId &&
              (myRoster?.length || opponentRoster?.length) ? (
                <div className="mt-1">
                  <TeamItcComparison
                    side1Name={entry.label}
                    side1Players={myRoster ?? []}
                    side2Name={latestPairing.opponentName}
                    side2Players={opponentRoster ?? []}
                    itcByUserId={itcByUserId}
                  />
                </div>
              ) : null}
              <Button variant="ghost" size="sm" className="mt-2 -ml-2.5" onClick={onGoToPairings}>
                View full pairings →
              </Button>
            </Card>
          );
        })
      )}
    </div>
  );
}
