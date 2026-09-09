import type { HTMLAttributes } from "react";
import clsx from "clsx";

type BadgeTone = "neutral" | "brass" | "danger" | "success" | "warning";

// Darker shade in light mode, lighter shade in dark mode, per tone — the
// underlying brass/danger/success/warning tokens don't themselves change
// between modes (see globals.css), but a shade that contrasts well on a
// near-white surface-1 needs to be different from one that contrasts
// well on charcoal, so the shade step is what flips, not the hue.
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-surface-border bg-surface-2 text-text-secondary",
  brass: "border-brass-500/30 bg-brass-500/15 text-brass-600 dark:text-brass-400",
  danger: "border-danger-500/30 bg-danger-500/15 text-danger-600 dark:text-danger-400",
  success: "border-success-500/30 bg-success-500/15 text-success-600 dark:text-success-400",
  warning: "border-warning-500/30 bg-warning-500/15 text-warning-600 dark:text-warning-400",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

/** Plain pill wrapper — the "sm" radius step per the token scale (badges/
 * pills are the one place that's deliberately tighter than a button's
 * "md"). ItcBadge/DispositionBadge keep their own domain logic (gradient
 * math, external links) rather than being rebuilt on this; this is for
 * visual consistency with new badges (status pills, role pills), not a
 * replacement for those two. */
export default function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
