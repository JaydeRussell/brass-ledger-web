import type { HTMLAttributes } from "react";
import clsx from "clsx";

type ErrorAlertSize = "sm" | "md";

const SIZE_CLASSES: Record<ErrorAlertSize, string> = {
  sm: "p-2 text-sm",
  md: "p-3 text-sm",
};

type ErrorAlertProps = HTMLAttributes<HTMLDivElement> & { size?: ErrorAlertSize };

/** The `role="alert"` danger box duplicated (with a drifting `/10` vs
 * `/15` background opacity) across every page/component that surfaces a
 * failed fetch — one implementation instead. `size="sm"` matches the
 * tighter padding used for an alert nested inside another card
 * (RoundBoard, MyPairings, PlacingsTable); `size="md"` (default) matches
 * a page-level banner. */
export default function ErrorAlert({ size = "md", className, children, ...props }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={clsx(
        "rounded-lg border border-danger-500/30 bg-danger-500/15 text-danger-600 dark:text-danger-400",
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
