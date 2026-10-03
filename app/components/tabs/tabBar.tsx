"use client";
import { Tabs, type TabItem } from "../ui/tabs";

export type TabKey = "overview" | "mine" | "team" | "roster" | "pairings" | "placings";

type TabBarProps = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  // Whether to show the Team tab — only when the signed-in account has a
  // shared home club with at least one other player at this event (see
  // app/event/page.tsx's myTeammates and myTeamPanel.tsx's own doc comment).
  // A tab with nothing behind it isn't worth showing.
  showTeamTab: boolean;
};

/**
 * Mirrors BCP's own event-page tabs (Overview / Roster / Pairings /
 * Placings), so the app feels familiar to anyone who's used
 * bestcoastpairings.com directly. Personalized content lives
 * in its own Mine tab ("Your round", always shown) and Team tab (shown
 * only when relevant), keeping Overview to the event facts BCP's own tab
 * shows.
 *
 * Built on ui/tabs.tsx's Radix-backed Tabs primitive (real roving-tabindex
 * keyboard nav — arrow keys move between tabs, Home/End jump to the
 * first/last). The {active, onChange} shape lets app/event/page.tsx keep
 * the active tab in sync with the URL.
 *
 * On a phone-width screen, several tabs plus comfortable tap targets
 * don't reliably fit without squishing — rather than shrinking the
 * labels or padding, the row scrolls horizontally (swipe to see a tab
 * that's cut off) and never wraps to a second line, which would eat
 * vertical space from an already-small screen. */
export default function TabBar({ active, onChange, showTeamTab }: TabBarProps) {
  const tabs: TabItem<TabKey>[] = [
    { value: "overview", label: "Overview" },
    { value: "mine", label: "Mine" },
    ...(showTeamTab ? ([{ value: "team", label: "Team" }] as const) : []),
    { value: "roster", label: "Roster" },
    { value: "pairings", label: "Pairings" },
    { value: "placings", label: "Placings" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4">
      <Tabs value={active} onValueChange={onChange} tabs={tabs} label="Event sections" />
    </div>
  );
}
