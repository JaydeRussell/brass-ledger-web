import type { HTMLAttributes } from "react";
import clsx from "clsx";

/** The `<main>` wrapper shared by every page — max width, horizontal
 * gutter, vertical rhythm between sections. See pageHeader.tsx for the
 * header half of the same pattern. `calendar/page.tsx` and
 * `admin/page.tsx` previously drifted from this (max-w-6xl, gap-4) with
 * no comment explaining why — treated as unintentional and aligned here. */
export default function PageMain({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <main className={clsx("mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6", className)} {...props} />;
}
