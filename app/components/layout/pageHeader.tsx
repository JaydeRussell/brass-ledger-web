import type { ReactNode } from "react";
import clsx from "clsx";
import HamburgerButton from "../nav/hamburgerButton";

type PageHeaderProps = {
  title: string;
  // The line under the title (e.g. the "pulls data from BCP, never
  // scores pairings" tagline) — omitted entirely on pages that don't
  // need one.
  subtitle?: ReactNode;
  // Hides `subtitle` below `sm:` — matches the home page's original
  // behavior of dropping its tagline on narrow screens once the header
  // also has to make room for `actions`.
  hideSubtitleOnMobile?: boolean;
  // Right-aligned content (e.g. the home page's following pills + event
  // settings gear). Once present, the header switches from a single
  // `items-center` row to a wrapping `justify-between` layout, since
  // title + actions no longer reliably fit one line on a phone.
  actions?: ReactNode;
};

/**
 * The `<HamburgerButton /> + <h1>` block every page opens with — was
 * hand-duplicated verbatim across all seven pages before this. See
 * pageMain.tsx for the matching `<main>` wrapper used right below it.
 */
export default function PageHeader({ title, subtitle, hideSubtitleOnMobile, actions }: PageHeaderProps) {
  const titleBlock = (
    <div>
      <h1 className="font-display text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{title}</h1>
      {subtitle && (
        <p className={clsx("mt-1 text-sm text-text-secondary", hideSubtitleOnMobile && "hidden sm:block")}>
          {subtitle}
        </p>
      )}
    </div>
  );

  if (!actions) {
    return (
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-4 pb-2 sm:pt-8">
        <HamburgerButton />
        {titleBlock}
      </header>
    );
  }

  return (
    <header className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-4 px-4 pt-4 pb-2 sm:pt-8">
      <div className="flex items-start gap-3">
        <HamburgerButton />
        {titleBlock}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </header>
  );
}
