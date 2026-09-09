"use client";
import { Tabs, type TabItem } from "../ui/tabs";

export type TabKey = "overview" | "roster" | "pairings" | "placings";

const TABS: TabItem<TabKey>[] = [
  { value: "overview", label: "Overview" },
  { value: "roster", label: "Roster" },
  { value: "pairings", label: "Pairings" },
  { value: "placings", label: "Placings" },
];

type TabBarProps = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

/** Mirrors the tab layout of BCP's own event page (Overview / Roster /
 * Pairings / Placings), so the app feels familiar to anyone who's used
 * bestcoastpairings.com directly.
 *
 * Built on ui/tabs.tsx's Radix-backed Tabs primitive (real roving-tabindex
 * keyboard nav — arrow keys move between tabs, Home/End jump to the
 * first/last — which the plain <button> row this replaced never had).
 * Keeps the exact same {active, onChange} external shape the original
 * hand-rolled version had, so app/page.tsx's URL-sync wiring needed no
 * changes at all.
 *
 * On a phone-width screen, four tabs plus comfortable tap targets don't
 * reliably fit without squishing — rather than shrinking the labels or
 * padding, the row scrolls horizontally (swipe to see a tab that's cut
 * off) and never wraps to a second line, which would eat vertical space
 * from an already-small screen. */
export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <Tabs value={active} onValueChange={onChange} tabs={TABS} label="Event sections" />
    </div>
  );
}
