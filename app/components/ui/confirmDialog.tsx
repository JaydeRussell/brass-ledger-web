"use client";
import * as RadixDialog from "@radix-ui/react-dialog";
import Button from "./button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  // "danger" for a destructive/one-way action (e.g. Reject) the person
  // can't self-recover from; "primary" otherwise.
  confirmVariant?: "primary" | "danger";
};

/**
 * A small centered "are you sure?" prompt — distinct from ui/dialog.tsx's
 * Dialog, which is a left-edge slide-in panel built specifically for the
 * nav drawer and isn't a fit for a compact confirm prompt. Built on the
 * same already-installed Radix Dialog primitive (focus trap, Escape-to-
 * close, aria roles for free) rather than adding a separate
 * @radix-ui/react-alert-dialog dependency for this one use.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  confirmVariant = "primary",
}: ConfirmDialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-30 bg-black/30" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-40 w-80 max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-surface-border bg-surface-1 p-4 shadow-xl outline-none">
          <RadixDialog.Title className="text-sm font-semibold text-text-primary">{title}</RadixDialog.Title>
          {description && (
            <RadixDialog.Description className="mt-1 text-sm text-text-secondary">
              {description}
            </RadixDialog.Description>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <RadixDialog.Close asChild>
              <Button variant="secondary" size="sm">
                {cancelLabel}
              </Button>
            </RadixDialog.Close>
            <Button
              variant={confirmVariant}
              size="sm"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
