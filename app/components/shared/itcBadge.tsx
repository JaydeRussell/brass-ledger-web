"use client";
import { buildBcpItcProfileUrl, type ItcRanking } from "../../lib/bcp";
import { itcGradientStyle } from "../../lib/scoreColor";

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
 * The colour reflects this player's own published ranking on a fixed
 * scale, never a comparison with whoever is viewing: colouring an
 * opponent "stronger than you" is the kind of matchup judgment the
 * project's scope rule rules out (see CLAUDE.md).
 */
export default function ItcBadge({ ranking, bcpUserId, leagueId, title, size = "sm" }: ItcBadgeProps) {
  if (!ranking) return null;

  // On a narrow screen, a crowded pairing row (opponent name, table,
  // faction, this badge, a score) has no room for the full "#15 ·
  // 1,465 pts" — the placing alone is the more universally-readable
  // number at that width, with the full label back once
  // there's room (Tailwind's `sm:` breakpoint). Roomy density always
  // shows the full label, prefixed "ITC".
  const compactLabel = `#${ranking.placing ?? "?"}`;
  const fullLabel = `#${ranking.placing ?? "?"} · ${Math.round(ranking.points)} pts`;
  const label = (
    <>
      <span className="sm:hidden roomy:hidden">{compactLabel}</span>
      <span className="hidden sm:inline roomy:inline">
        <span className="hidden roomy:inline">ITC </span>
        {fullLabel}
      </span>
    </>
  );
  const { backgroundColor, color } = itcGradientStyle(ranking);
  const sizeClasses = size === "xs" ? "px-1.5 py-0.5 text-2xs" : "px-1.5 py-0.5 text-xs";
  const sharedClasses = `inline-flex min-h-[24px] shrink-0 items-center whitespace-nowrap rounded-full border border-white/10 font-medium roomy:min-h-7 ${sizeClasses}`;

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
