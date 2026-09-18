"use client";
import React from "react";
import clsx from "clsx";
import { AUTO_DISMISS_MS, useToastViewport, type Toast, type ToastVariant } from "./toastContext";

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "border-success-500/30 bg-success-500/15 text-success-400",
  error: "border-danger-500/30 bg-danger-500/15 text-danger-400",
  info: "border-surface-border bg-surface-2 text-text-primary",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const arm = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
  }, [onDismiss, toast.id]);

  React.useEffect(() => {
    arm();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [arm]);

  return (
    <li
      // Pausing on hover/focus so a toast being read doesn't vanish
      // mid-read — cleared entirely rather than just extended, so
      // moving away restarts the full window instead of whatever was
      // left.
      onMouseEnter={() => timeoutRef.current && clearTimeout(timeoutRef.current)}
      onMouseLeave={arm}
      onFocus={() => timeoutRef.current && clearTimeout(timeoutRef.current)}
      onBlur={arm}
      className={clsx(
        "pointer-events-auto flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm shadow-lg",
        VARIANT_CLASSES[toast.variant]
      )}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 text-current opacity-60 hover:opacity-100"
      >
        <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
          <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  );
}

/**
 * The stack itself — mounted once in app/layout.tsx alongside every
 * other "appears on top of everything" fixture (NavDrawer, FeedbackWidget,
 * CommandPalette). Top-right, since FeedbackWidget already owns
 * bottom-right and the nav hamburger owns top-left. A plain fixed-position
 * list, not a portal — see feedbackWidget.tsx's own doc comment on why
 * this codebase avoids portaling UI that a static-SSR test pass needs to
 * see into.
 */
export default function ToastViewport() {
  const { toasts, dismissToast } = useToastViewport();

  return (
    <ul
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 print:hidden"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </ul>
  );
}
