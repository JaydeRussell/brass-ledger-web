import Badge from "../ui/badge";

type DispositionBadgeProps = {
  disposition?: string;
};

// The five Force Dispositions, each mapped to a short label and a Badge
// tone chosen for what the disposition means on the table, not just for
// visual variety: Purge the Foe (killing) reads as danger/red, Take and
// Hold (holding ground) as success/green, Priority Assets (what to watch)
// as warning/amber, Reconnaissance (quiet, low-key) as neutral/gray, and
// Disruption — the odd one out — gets the app's own brass accent.
const DISPOSITIONS: Record<string, { label: string; tone: "neutral" | "brass" | "danger" | "success" | "warning" }> = {
  "Purge the Foe": { label: "Purge", tone: "danger" },
  Reconnaissance: { label: "Recon", tone: "neutral" },
  "Priority Assets": { label: "Priority", tone: "warning" },
  "Take and Hold": { label: "T&H", tone: "success" },
  Disruption: { label: "Disruption", tone: "brass" },
};

/**
 * A player's 40k 11th edition Force Disposition (Take and Hold / Purge
 * the Foe / Disruption / Reconnaissance / Priority Assets), when BCP's
 * data for this event carries one — see types/player.d.ts's note on
 * Player.disposition. Renders nothing otherwise, the same "absent means
 * not shown" pattern ItcBadge uses. Built on ui/badge.tsx's shell
 * rather than its own hand-rolled pill, per the redesign's token system.
 * Abbreviates and color-codes the five known dispositions (see
 * DISPOSITIONS above); an unrecognized value is shown as-is in neutral,
 * since the backend's exact-match derivation (internal/bcp/types.go's
 * forceDispositions) means this should never actually happen.
 */
export default function DispositionBadge({ disposition }: DispositionBadgeProps) {
  if (!disposition) return null;

  const known = DISPOSITIONS[disposition];
  return <Badge tone={known?.tone ?? "neutral"}>{known?.label ?? disposition}</Badge>;
}
