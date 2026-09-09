import Badge from "../ui/badge";

type DispositionBadgeProps = {
  disposition?: string;
};

/**
 * A player's 40k 11th edition Force Disposition (Take and Hold / Purge
 * the Foe / Disruption / Reconnaissance / Priority Assets), when BCP's
 * data for this event carries one — see types/player.d.ts's note on
 * Player.disposition. Renders nothing otherwise, the same "absent means
 * not shown" pattern ItcBadge uses. Built on ui/badge.tsx's shell
 * (neutral tone — a disposition is informational, not an accent/action)
 * rather than its own hand-rolled pill, per the redesign's token system.
 */
export default function DispositionBadge({ disposition }: DispositionBadgeProps) {
  if (!disposition) return null;

  return <Badge tone="neutral">{disposition}</Badge>;
}
