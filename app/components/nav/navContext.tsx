"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type NavContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const NavContext = createContext<NavContextValue | null>(null);

/**
 * Open/closed state for the left-hand nav drawer (see navDrawer.tsx),
 * shared across every page via a single provider mounted once in
 * app/layout.tsx — a hamburger button on any page can open the same
 * drawer without each page owning its own copy of the state.
 */
export function NavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error("useNav must be used within a NavProvider");
  }
  return ctx;
}
