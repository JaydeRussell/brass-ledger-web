import type { ReactNode } from "react";
import clsx from "clsx";

type EmptyStateProps = {
  // Decorative only (icon || no icon, never load-bearing content) —
  // always rendered aria-hidden, same division of labor as Spinner's own
  // decorative animation.
  icon?: ReactNode;
  title?: string;
  message: ReactNode;
  // A link or button offering the obvious next step (e.g. "Check the
  // calendar") — omit for an empty state with no next step worth
  // pointing at.
  action?: ReactNode;
  className?: string;
};

/**
 * A whole-panel/card "there's nothing here (yet)" state — dashed border,
 * centered, same shape EventList's own inline version established
 * before this existed. Deliberately not for a single empty row inside an
 * existing table/list (RoundBoard's "No pairings published yet",
 * Roster's "No players found") — those stay plain inline text; wrapping
 * every one of those in an icon+card would out-weigh the row it sits in.
 * This is for the cases where an entire section has nothing to show.
 */
export default function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-surface-border p-6 text-center",
        className
      )}
    >
      {icon && (
        <div aria-hidden className="mb-1 text-text-tertiary">
          {icon}
        </div>
      )}
      {title && <p className="text-sm font-semibold text-text-primary">{title}</p>}
      <p className="text-sm text-text-secondary">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
