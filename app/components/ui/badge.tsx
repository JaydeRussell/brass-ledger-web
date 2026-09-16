import type { HTMLAttributes } from "react";
import clsx from "clsx";

type BadgeTone = "neutral" | "brass" | "danger" | "success" | "warning";

// The lighter *-400 shade of each tone, per tone — this app is dark-mode-
// only, and *-400 is the step that contrasts well against a charcoal
// surface (the *-600 step exists for a light background this app no
// longer has).
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-surface-border bg-surface-2 text-text-secondary",
  brass: "border-brass-500/30 bg-brass-500/15 text-brass-400",
  danger: "border-danger-500/30 bg-danger-500/15 text-danger-400",
  success: "border-success-500/30 bg-success-500/15 text-success-400",
  warning: "border-warning-500/30 bg-warning-500/15 text-warning-400",
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
