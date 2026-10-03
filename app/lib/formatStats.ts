import type { PlacingWithField } from "./myStats";

// Pure placing/field formatting shared by everything that shows a
// finish: the player-stats panel, the public dossier page, Home's
// "Your record" card, the placing trend chart, and the share card.
//
// Kept apart from components/myEvents/playerStatsPanel.tsx so that
// pages needing only `ordinal` don't pull the whole panel component onto
// their critical path, and so there is one copy of each rule.

/** 1st/2nd/3rd/4th… Rounds first, so a computed (fractional) placing
 * from the trend chart's interpolation formats the same way. */
export function ordinal(n: number): string {
  const rounded = Math.round(n);
  const mod100 = rounded % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rounded}th`;
  switch (rounded % 10) {
    case 1:
      return `${rounded}st`;
    case 2:
      return `${rounded}nd`;
    case 3:
      return `${rounded}rd`;
    default:
      return `${rounded}th`;
  }
}

/** "of 53 · top 4%" — undefined if the event never published a field size. */
export function fieldDetail(p?: PlacingWithField): string | undefined {
  if (!p?.fieldSize) return undefined;
  const percentile = Math.max(1, Math.round((p.placing / p.fieldSize) * 100));
  return `of ${p.fieldSize} · top ${percentile}%`;
}
