import type { PlacingWithField } from "./myStats";

// Pure placing/field formatting shared by everything that shows a
// finish: the player-stats panel, the public dossier page, Home's
// "Your record" card, the placing trend chart, and the share card.
//
// These lived in components/myEvents/playerStatsPanel.tsx until they
// were pulled out here. Two reasons. Importing `ordinal` from that
// module dragged the whole 14.8 KB panel component onto the critical
// path of every page that wanted the one-line rule (app/page.tsx and
// the dossier page both did). And the rule had quietly been copied
// twice more — placingTrendChart.tsx had a private `ordinal`, and
// shareCard.ts an `ordinalPlacing` whose own comment explained it was
// duplicated because there was no shared module to put it in. There is
// now.

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
