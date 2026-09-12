import type { ItcRanking } from "../../lib/bcp";

type TeamItcComparisonProps = {
  side1Name: string;
  side1Players: Player[];
  side2Name: string;
  side2Players: Player[];
  itcByUserId: Record<string, ItcRanking | null>;
};

function averageItc(players: Player[], itcByUserId: Record<string, ItcRanking | null>): number | undefined {
  const points = players
    .map((p) => (p.bcpUserId ? itcByUserId[p.bcpUserId]?.points : undefined))
    .filter((p): p is number => typeof p === "number");
  if (points.length === 0) return undefined;
  return points.reduce((sum, p) => sum + p, 0) / points.length;
}

/**
 * A neutral, side-by-side display of two already-published numbers —
 * each side's average ITC across its own roster, the same per-player
 * ITC already shown elsewhere (ItcBadge) just averaged across a team.
 * Deliberately no framing, bar, "favored"/"underdog" label, or color
 * tied to which number is higher — showing two facts, not a computed
 * judgment about the matchup. See CLAUDE.md's scope rule and
 * ROADMAP.md's "Declined" section (a "favored team" indicator) for why
 * that line matters even at team-aggregate level.
 */
export default function TeamItcComparison({
  side1Name,
  side1Players,
  side2Name,
  side2Players,
  itcByUserId,
}: TeamItcComparisonProps) {
  const side1Avg = averageItc(side1Players, itcByUserId);
  const side2Avg = averageItc(side2Players, itcByUserId);
  if (side1Avg === undefined && side2Avg === undefined) return null;

  const format = (avg: number | undefined) => (avg !== undefined ? `Avg ITC ${Math.round(avg)}` : "Avg ITC —");

  return (
    <p className="text-xs text-text-secondary">
      {side1Name}: {format(side1Avg)} · {side2Name}: {format(side2Avg)}
    </p>
  );
}
