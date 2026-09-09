type DispositionBadgeProps = {
  disposition?: string;
};

/**
 * A player's 40k 11th edition Force Disposition (Take and Hold / Purge
 * the Foe / Disruption / Reconnaissance / Priority Assets), when BCP's
 * data for this event carries one — see types/player.d.ts's note on
 * Player.disposition. Renders nothing otherwise, the same "absent means
 * not shown" pattern ItcBadge uses.
 */
export default function DispositionBadge({ disposition }: DispositionBadgeProps) {
  if (!disposition) return null;

  return (
    <span className="shrink-0 whitespace-nowrap rounded-full border border-black/10 bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
      {disposition}
    </span>
  );
}
