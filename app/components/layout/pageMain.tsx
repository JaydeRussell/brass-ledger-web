import type { HTMLAttributes } from "react";
import clsx from "clsx";

/** The `<main>` wrapper shared by every page — max width, horizontal
 * gutter, vertical rhythm between sections. See pageHeader.tsx for the
 * header half of the same pattern. Room for the mobile BottomTabBar is
 * left by Footer, which always follows this. */
export default function PageMain({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={clsx(
        "mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-6 pb-6",
        className
      )}
      {...props}
    />
  );
}
