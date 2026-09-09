import type { HTMLAttributes } from "react";
import clsx from "clsx";

/** Plain styled panel — the surface-1/border-lg shell used by cards,
 * roster entries, and stat blocks throughout the redesign. */
export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-lg border border-surface-border bg-surface-1", className)} {...props} />;
}
