// 40k 11th edition's five Force Dispositions — the canonical list backing
// both the roster's DispositionBadge and the "Your round" mission-matchup
// panel. See types/player.d.ts's Player.disposition for how this value
// reaches the app (BCP has no dedicated field; the backend derives it from
// subFaction when that's an exact match for one of these five).
export type Disposition =
  | "Take and Hold"
  | "Purge the Foe"
  | "Priority Assets"
  | "Reconnaissance"
  | "Disruption";

export const DISPOSITIONS: readonly Disposition[] = [
  "Take and Hold",
  "Purge the Foe",
  "Priority Assets",
  "Reconnaissance",
  "Disruption",
];

export function isDisposition(value: string | undefined): value is Disposition {
  return value !== undefined && (DISPOSITIONS as readonly string[]).includes(value);
}

/** Kebab-case slug for a disposition, used to build deployment-map asset
 * paths (see missionMatchups.ts's deploymentMapPaths). */
export function dispositionSlug(disposition: Disposition): string {
  return disposition.toLowerCase().replace(/\s+/g, "-");
}
