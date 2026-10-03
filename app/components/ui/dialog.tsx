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
 * drawer. The backdrop and panel carry `forceMount` and data-state-driven
 * `transition-*` classes, but the Portal isn't force-mounted, so a closed
 * Dialog renders nothing: the panel enters the DOM already open and
 * leaves it at once on close, and neither transition plays. Radix
 * supplies focus-trapping and Escape-to-close.
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
