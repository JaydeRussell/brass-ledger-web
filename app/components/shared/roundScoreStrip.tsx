import type { MyPairing } from "../../lib/bcp";
import { classifyScore, SCORE_OUTCOME_CLASSES } from "../../lib/scoreColor";

/**
 * A compact "62 / 91 / 74" round-by-round score strip, each round
 * colored by its own win/loss/draw margin (see lib/scoreColor.ts) —
 * BCP's own already-published per-round score for this entry, not a
 * recomputed record. Originally the Placings tab's stand-in for a
 * row's plain win/loss-record value (see placingsTable.tsx), reused
 * as-is on the Team tab (myTeamPanel.tsx) to make each teammate's
 * record just as glanceable there.
 *
 * A flex-wrap container rather than one nowrap line: a 3-round event
 * fits on one line same as before, but a longer event (5-6+ rounds) on
 * a narrow phone screen wraps onto a second line instead of forcing
 * whatever table/list it's in into horizontal scroll — that scroll was
 * the actual problem on Placings, since it pushed this very column
 * (the one thing a player most wants to check) out past the edge of
 * the screen. Each round's own "/ 91" stays grouped in one nowrap span
 * so a wrap can only land between rounds, never orphan a bare "/" on
 * its own line; justify-end keeps every wrapped line right-aligned.
 */
export default function RoundScoreStrip({ pairings }: { pairings: MyPairing[] }) {
  return (
    <span className="flex flex-wrap justify-end gap-x-1.5 gap-y-0.5">
      {pairings.map((p, i) => (
        <span key={p.round} className="whitespace-nowrap">
          {i > 0 && <span className="text-text-tertiary">/ </span>}
          <span
            className={
              p.myScore !== undefined && p.opponentScore !== undefined
                ? SCORE_OUTCOME_CLASSES[classifyScore(p.myScore, p.opponentScore)]
                : "text-text-tertiary"
            }
            title={`Round ${p.round}${
              p.myScore !== undefined && p.opponentScore !== undefined
                ? `: ${p.myScore}–${p.opponentScore} vs ${p.opponentName}`
                : ""
            }`}
          >
            {p.myScore ?? "—"}
          </span>
        </span>
      ))}
    </span>
  );
}
