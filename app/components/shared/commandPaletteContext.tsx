"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type CommandPaletteContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

/**
 * Open/closed state for the ⌘K quick switcher (see commandPalette.tsx),
 * shared across every page via a single provider mounted once in
 * app/layout.tsx — same "one shared piece of state, one hamburger-style
 * trigger anywhere" pattern as navContext.tsx's NavProvider/useNav for
 * the nav drawer. A separate context from NavContext rather than folded
 * into it: they're two independent overlays (either can open while the
 * other is closed), not one "which panel is open" state machine.
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return ctx;
}
