type ArmyListLinkProps = {
  href: string;
  playerName: string;
};

/**
 * A player's published BCP army list, as a pill shaped like ui/badge.tsx
 * so it sits level with the disposition badge beside it. Neutral at rest
 * so it doesn't compete with the color-coded dispositions; brass on hover.
 */
export default function ArmyListLink({ href, playerName }: ArmyListLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`${playerName}'s army list on BCP`}
      title="Army list on BCP"
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm roomy:min-h-7 border border-surface-border bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-text-secondary transition-colors hover:border-brass-500/40 hover:bg-brass-500/15 hover:text-brass-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60"
    >
      <svg aria-hidden viewBox="0 0 16 16" fill="none" className="h-3 w-3">
        <path
          d="M4.5 1.75h4.75L12.5 5v8.25a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V2.75a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M6 8h4M6 10.75h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      List
    </a>
  );
}
