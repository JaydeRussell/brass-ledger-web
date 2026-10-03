"use client";
import { useId, useState, type ReactNode } from "react";

/**
 * A collapsible "Display" section for the nav drawer, holding the visual
 * settings so they don't push the nav links down. Starts collapsed.
 */
export default function DisplayMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left text-xs text-text-secondary hover:bg-surface-2"
      >
        <span className="font-medium text-text-primary">Display</span>
        <span aria-hidden className={`transition-transform ${open ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>
      {open && (
        <div id={panelId} className="mt-1 flex flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
