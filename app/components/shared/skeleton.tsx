type SkeletonProps = {
  // Sizing/shape is entirely up to the caller via Tailwind width/height
  // utilities (e.g. "h-4 w-32") — this primitive has no built-in
  // variants, same "plain, composable" posture as Spinner/Badge.
  className?: string;
};

/**
 * A pulsing placeholder block — Tailwind's built-in `animate-pulse`, no
 * extra dependency — for a loading state that's better shown as "the
 * shape of what's coming" than a spinner-plus-caption (a whole panel's
 * first paint: the overview card, a table, a list of rounds). `aria-hidden`
 * since every call site pairs this with its own screen-reader-only
 * "Loading …" text (see e.g. overviewPanel.tsx) — same division of
 * labor Spinner already uses for its own decorative animation.
 */
export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-surface-2 ${className}`} />;
}
