// The app's static top-level pages — shared between navDrawer.tsx (the
// nav drawer's own link list) and commandPalette.tsx (so ⌘K search
// covers the same set of pages, rather than a second hand-maintained
// copy that can drift out of sync with the drawer).
//
// "/" is Home (a cross-event dashboard — see app/page.tsx) as of the
// home-dashboard rewrite; the tabbed single-event view that used to
// live at "/" moved to "/event" (app/event/page.tsx, unchanged
// internally — it already read its own event/tab state entirely from
// query params via usePathname(), so the move needed no logic changes
// there). Deliberately no separate top-level "Event" link pointing at
// "/event" — reaching a specific event happens through Home's own
// "Continue"/"Next up" card or My Events' per-event links
// (eventList.tsx), not a bare, contextless nav item.
export const NAV_LINKS: readonly { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/my-events", label: "My Events" },
  { href: "/friends", label: "Friends" },
  { href: "/calendar", label: "Calendar" },
  { href: "/stats", label: "Player Stats" },
  { href: "/wiki", label: "Wiki" },
  { href: "/about", label: "About" },
  { href: "/changelog", label: "Changelog" },
];
