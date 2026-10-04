import type { MyPairing } from "../../lib/bcp";
import { classifyScore, SCORE_OUTCOME_CLASSES } from "../../lib/scoreColor";

/**
 * A compact "62 / 91 / 74" round-by-round score strip, each round
 * colored by its own win/loss/draw margin (see lib/scoreColor.ts) —
 * BCP's own already-published per-round score, not a recomputed record.
 * Used on Placings rows and the Team tab.
 *
 * Wraps rather than forcing its container into horizontal scroll on a
 * narrow phone once an event runs to 5-6+ rounds. Each round's "/ 91"
 * stays in one nowrap span, so a wrap only lands between rounds.
 */
export default function RoundScoreStrip({
  pairings,
  align = "end",
}: {
  pairings: MyPairing[];
  align?: "start" | "end";
}) {
  return (
    <span className={`flex flex-wrap gap-x-1.5 gap-y-0.5 ${align === "start" ? "justify-start" : "justify-end"}`}>
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
