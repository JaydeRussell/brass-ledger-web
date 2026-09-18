"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// How long a toast stays up before auto-dismissing itself. Not a "timer
// firing a fetch" — see CLAUDE.md's no-polling rule — just a UI-only
// countdown on something already in memory; ToastViewport also pauses it
// on hover/focus so a toast being read doesn't vanish mid-read.
const AUTO_DISMISS_MS = 5000;

let nextId = 1;

/**
 * A confirmation/error surface for actions that don't otherwise say
 * "that worked" — same "mount once in app/layout.tsx, shared via
 * context" shape as NavProvider (navContext.tsx). Kept deliberately
 * separate from ErrorAlert (ui/errorAlert.tsx), which is for a
 * standing, in-place failure (a panel that couldn't load its data);
 * this is for a one-off event (an action just completed) that shouldn't
 * leave a permanent mark on the page once acknowledged.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/** Returns `showToast(message, variant?)` — call it from any client
 * component nested under the app's root ToastProvider (app/layout.tsx)
 * once an action succeeds or fails and there's nothing already on
 * screen that says so. */
export function useToast(): { showToast: ToastContextValue["showToast"] } {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return { showToast: ctx.showToast };
}

/** Internal — ToastViewport is the only other consumer of the full
 * context value (toasts + dismissToast), kept out of useToast's public
 * surface so call sites can't reach into the list/dismiss another
 * toast. */
export function useToastViewport(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToastViewport must be used within a ToastProvider");
  }
  return ctx;
}

export { AUTO_DISMISS_MS };
