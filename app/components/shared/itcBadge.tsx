"use client";
import { buildBcpItcProfileUrl, type ItcRanking } from "../../lib/bcp";
import { itcGradientStyle } from "../../lib/scoreColor";
import { useViewerItcRanking } from "../../lib/viewerItc";

type ItcBadgeProps = {
  ranking: ItcRanking | null | undefined;
  bcpUserId?: string;
  leagueId?: string | null;
  title: string;
  // A touch smaller/tighter for spots where several of these sit on one
  // crowded line (individual board rows, opponent slots in a round list).
  size?: "sm" | "xs";
};

/**
 * A player's already-published ITC score/rank, shown as a small pill whose
 * background runs blue (a low score / weak ranking) through green, yellow,
 * and orange to red (a high score / strong ranking) — see itcGradientStyle
 * in lib/scoreColor.ts. Renders nothing until a ranking is actually known
 * (undefined while still loading, null once resolved as "no ranking in
 * this league").
 *
 * When the visitor viewing the page is themselves signed in with a BCP
 * profile linked and ranked in this same league (see useViewerItcRanking),
 * the gradient runs relative to *their* ranking instead of the fixed
 * absolute scale — this player reads as "stronger than you" or "weaker
 * than you" rather than just "strong or weak in general." Falls back to
 * the absolute scale automatically otherwise.
 */
export default function ItcBadge({ ranking, bcpUserId, leagueId, title, size = "sm" }: ItcBadgeProps) {
  const viewerRanking = useViewerItcRanking(leagueId);
  if (!ranking) return null;

  // On a narrow screen, a crowded pairing row (opponent name, table,
  // faction, this badge, a score) has no room for the full "#15 ·
  // 1,465 pts" — the placing alone is the more universally-readable
  // number at that width (roadmap #8), with the full label back once
  // there's room (Tailwind's `sm:` breakpoint).
  const compactLabel = `#${ranking.placing ?? "?"}`;
  const fullLabel = `#${ranking.placing ?? "?"} · ${Math.round(ranking.points)} pts`;
  const label = (
    <>
      <span className="sm:hidden">{compactLabel}</span>
      <span className="hidden sm:inline">{fullLabel}</span>
    </>
  );
  const { backgroundColor, color } = itcGradientStyle(ranking, viewerRanking);
  const sizeClasses = size === "xs" ? "px-1.5 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-xs";
  const sharedClasses = `shrink-0 whitespace-nowrap rounded-full border border-white/10 font-medium ${sizeClasses}`;

  if (!bcpUserId) {
    return (
      <span style={{ backgroundColor, color }} className={sharedClasses}>
        {label}
      </span>
    );
  }

  return (
    <a
      href={buildBcpItcProfileUrl(bcpUserId, leagueId ?? undefined)}
      target="_blank"
      rel="noreferrer"
      title={title}
      style={{ backgroundColor, color }}
      className={`${sharedClasses} hover:opacity-80`}
    >
      {label}
    </a>
  );
}
