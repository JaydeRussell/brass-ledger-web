"use client";
import type { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Radix requires an accessible title on every Dialog.Content — pass
  // `hideTitle` when the panel already shows its own visible heading
  // (e.g. the nav drawer's own "Brass Ledger" header row) so this still
  // satisfies screen readers without a second, visually-duplicate title.
  title: string;
  hideTitle?: boolean;
  children?: ReactNode;
};

/**
 * A left-edge slide-in panel (not a centered modal) — built for the nav
 * drawer, the one real consumer this app needs today. Both the backdrop
 * and the panel use `forceMount` and stay in the DOM even while closed,
 * driven purely by Radix's `data-state="open"|"closed"` attribute, so the
 * existing `transition-transform` slide can actually play on close (Radix
 * unmounts Content immediately on close otherwise, with no exit
 * animation window) — this app has no CSS-animation library installed,
 * so plain data-state-driven transition classes are the right tool here,
 * not `animate-in`/`animate-out` utilities.
 *
 * Replaces navDrawer.tsx's hand-rolled backdrop+panel pair. Gains real
 * focus-trapping and Escape-to-close for free, which the hand-rolled
 * version lacked — its `role="dialog"`/`aria-modal` were already correct,
 * but nothing enforced keyboard focus staying inside the drawer.
 */
export function Dialog({ open, onOpenChange, title, hideTitle, children }: DialogProps) {
  const titleEl = <RadixDialog.Title className="text-sm font-semibold text-text-primary">{title}</RadixDialog.Title>;

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          forceMount
          className="fixed inset-0 z-30 bg-black/30 transition-opacity duration-200 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
        />
        <RadixDialog.Content
          forceMount
          className="fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-surface-border bg-surface-1 shadow-xl outline-none transition-transform duration-200 data-[state=closed]:pointer-events-none data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0"
        >
          {hideTitle ? <VisuallyHidden asChild>{titleEl}</VisuallyHidden> : titleEl}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

// Re-exported as-is so a consumer can build a close button without this
// wrapper needing to guess every possible trigger shape (an icon button,
// a link, etc.) — see Radix's own Dialog.Close, unstyled.
export const DialogClose = RadixDialog.Close;
