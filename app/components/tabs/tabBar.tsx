"use client";

export type TabKey = "overview" | "roster" | "pairings" | "placings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "roster", label: "Roster" },
  { key: "pairings", label: "Pairings" },
  { key: "placings", label: "Placings" },
];

type TabBarProps = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

/** Mirrors the tab layout of BCP's own event page (Overview / Roster /
 * Pairings / Placings), so the app feels familiar to anyone who's used
 * bestcoastpairings.com directly.
 *
 * On a phone-width screen, four tabs plus comfortable tap targets don't
 * reliably fit without squishing — rather than shrinking the labels or
 * padding, this lets the row scroll horizontally (swipe to see a tab
 * that's cut off) and never wraps to a second line, which would eat
 * vertical space from an already-small screen. */
export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="scrollbar-none mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
