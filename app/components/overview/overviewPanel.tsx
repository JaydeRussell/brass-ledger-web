"use client";
import type { EventInfo, ItcRanking, MyPairing, TeamBoardMatchup } from "../../lib/bcp";
import MyRoundCard from "../pairings/myRoundCard";
import LinkifiedText from "../shared/linkifiedText";
import TeamItcComparison from "../shared/teamItcComparison";
import Spinner from "../shared/spinner";
import Card from "../ui/card";
import Button from "../ui/button";
import { useDelayedFlag } from "../../lib/useDelayedFlag";
import { formatDateRange } from "../../lib/eventDates";

type FollowedSummary = {
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
// hasn't started), in which case OverviewPanel renders exactly as before.
type MyRoundSummary = {
  round: number;
  loading: boolean;
  error: string | null;
  pairing: MyPairing | null;
  board: TeamBoardMatchup | null;
  myBcpUserId?: string;
  players: Player[];
  myTeamPlayerId?: string;
  rosterByTeamId?: Map<string, Player[]>;
  itcLeagueId?: string | null;
  itcByUserId?: Record<string, ItcRanking | null>;
};

type OverviewPanelProps = {
  eventInfo: EventInfo | null;
  myRound?: MyRoundSummary | null;
  following: FollowedSummary[];
  // Shared with MyRoundCard — see its own props for what these are.
  rosterByTeamId?: Map<string, Player[]>;
  itcByUserId?: Record<string, ItcRanking | null>;
  onGoToRoster: () => void;
  onGoToPairings: () => void;
};

function statusLine(info: EventInfo): string {
  if (!info.started) return "Hasn't started yet";
  if (info.ended) return `Ended — ${info.numberOfRounds} round${info.numberOfRounds === 1 ? "" : "s"}`;
  return `Round ${info.currentRound} of ${info.numberOfRounds || "?"} — in progress`;
}

/**
 * A handful of small facts about the event, laid out like BCP's own
 * Overview tab: dates, location, organizer, and registration counts.
 * Nothing here is computed — it's straight from BCP's event metadata.
 */
function FactRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="w-24 shrink-0 text-text-tertiary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}

/**
 * The event's landing tab: what it is, where it's at, plus the event facts
 * BCP's own Overview tab shows (dates, venue, organizer, registration
 * counts, description) — and (for each team or player you're following) a
 * quick glance at their most recent published pairing, with a link into
 * the full Pairings tab for the round-by-round detail.
 */
export default function OverviewPanel({
  eventInfo,
  myRound,
  following,
  rosterByTeamId,
  itcByUserId,
  onGoToRoster,
  onGoToPairings,
}: OverviewPanelProps) {
  const dateRange = eventInfo ? formatDateRange(eventInfo.startDate, eventInfo.endDate) : undefined;
  const slowLoad = useDelayedFlag(!eventInfo);

  return (
    <div className="flex flex-col gap-4">
      {myRound && (
        <MyRoundCard
          loading={myRound.loading}
          error={myRound.error}
          round={myRound.round}
          pairing={myRound.pairing}
          board={myRound.board}
          myBcpUserId={myRound.myBcpUserId}
          players={myRound.players}
          myTeamPlayerId={myRound.myTeamPlayerId}
          rosterByTeamId={myRound.rosterByTeamId}
          itcLeagueId={myRound.itcLeagueId}
          itcByUserId={myRound.itcByUserId}
        />
      )}

      <Card className="p-4 shadow-sm">
        {eventInfo ? (
          <>
            {eventInfo.gameSystem && (
              <p className="text-xs font-semibold uppercase tracking-wide text-brass-500">{eventInfo.gameSystem}</p>
            )}
            <p className="mt-0.5 font-semibold text-text-primary">{eventInfo.name}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {eventInfo.teamEvent ? "Team event" : "Singles event"} · {statusLine(eventInfo)}
            </p>

            <div className="mt-3 flex flex-col gap-1 border-t border-surface-border pt-3">
              <FactRow label="Dates" value={dateRange} />
              <FactRow label="Location" value={eventInfo.location} />
              <FactRow label="Organizer" value={eventInfo.organizer} />
              <FactRow
                label={eventInfo.registrationLabel ?? "Registered"}
                value={
                  eventInfo.registrationCount ??
                  (eventInfo.playerCount !== undefined ? String(eventInfo.playerCount) : undefined)
                }
              />
              <FactRow label="Circuits" value={eventInfo.circuits?.join(", ")} />
            </div>

            {eventInfo.description && (
              <LinkifiedText
                text={eventInfo.description}
                className="mt-3 whitespace-pre-wrap border-t border-surface-border pt-3 text-sm text-text-secondary"
              />
            )}
          </>
        ) : (
          <div aria-live="polite">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Spinner size="sm" />
              <span>Loading event…</span>
            </div>
            {slowLoad && (
              <p className="mt-1 text-xs text-text-tertiary">
                Taking longer than usual — this is a first look at this event, so it&apos;s asking
                Best Coast Pairings directly.
              </p>
            )}
          </div>
        )}
      </Card>

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
