"use client";
import * as RadixTabs from "@radix-ui/react-tabs";

export type TabItem<T extends string> = { value: T; label: string };

type TabsProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  tabs: TabItem<T>[];
  // Accessible name for the tab list itself (e.g. "Event sections",
  // "My events range") — Radix's Tabs.List doesn't require one, but a
  // screen reader announcing a bare, unlabeled tablist is a real
  // regression from the plain <nav> this replaces.
  label: string;
};

/**
 * A horizontally-scrolling, non-wrapping tab row — visually matches the
 * pre-Radix TabBar (same .scrollbar-none swipe-to-see-more pattern for a
 * phone-width screen, same brass-accented active indicator) but gains
 * real roving-tabindex keyboard navigation (arrow keys move between
 * tabs, Home/End jump to the first/last) for free, which the plain
 * <button> row it replaces never had.
 *
 * Generic over the tab-key union type so both TabBar's
 * `"overview"|"roster"|"pairings"|"placings"` and /my-events's
 * `"past"|"ongoing"|"future"` can be rebuilt on this same primitive
 * without either widening to a shared `string` type.
 */
export function Tabs<T extends string>({ value, onValueChange, tabs, label }: TabsProps<T>) {
  return (
    <RadixTabs.Root value={value} onValueChange={(v) => onValueChange(v as T)}>
      <RadixTabs.List aria-label={label} className="scrollbar-none mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className="shrink-0 whitespace-nowrap rounded-t-lg border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-text-secondary outline-none transition-colors hover:text-text-primary data-[state=active]:border-brass-500 data-[state=active]:text-brass-500 focus-visible:ring-2 focus-visible:ring-brass-500/50"
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
