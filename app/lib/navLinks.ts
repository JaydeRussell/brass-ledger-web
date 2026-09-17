// The app's static top-level pages — shared between navDrawer.tsx (the
// nav drawer's own link list) and commandPalette.tsx (so ⌘K search
// covers the same set of pages, rather than a second hand-maintained
// copy that can drift out of sync with the drawer).
export const NAV_LINKS: readonly { href: string; label: string }[] = [
  { href: "/", label: "Event" },
  { href: "/my-events", label: "My Events" },
  { href: "/friends", label: "Friends" },
  { href: "/calendar", label: "Calendar" },
  { href: "/stats", label: "Player Stats" },
  { href: "/wiki", label: "Wiki" },
  { href: "/about", label: "About" },
  { href: "/changelog", label: "Changelog" },
];
