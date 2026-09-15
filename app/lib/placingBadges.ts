import type { PlacingEntry } from "./bcp";
import { superFactionOf, type SuperFaction } from "./superFaction";

export type PlacingBadge = {
  // The entry's own, unnormalized faction string (for display, e.g.
  // "Best Space Marines (Astartes)") — grouping for this one is exact,
  // per-event BCP text, not run through superFaction.ts's normalization
  // (that's only needed to resolve the three-way super-faction bucket
  // below, not to decide who's best within one faction).
  bestFaction?: string;
  bestSuperFaction?: SuperFaction;
};

/**
 * Works out, for one event's already-fetched placings, which entries are
 * the best-placed within their own faction and within their super
 * faction (Imperium/Chaos/Xenos) — a lower `placing` number is better.
 * Ties (BCP can and does publish them) all get the badge, not just
 * whichever entry happens to come first in the array. Team-event entries
 * (no `faction`, see PlacingEntry's doc comment) and any entry with no
 * `placing` yet are simply never awarded one — this needs no special
 * team-event handling, the data just isn't there to award on.
 *
 * Returns a lookup by entry.id, computed once per render off the
 * `entries` PlacingsTable already has (see that component's useMemo) —
 * not a new prop threaded in from further up like `followedIds`, since
 * everything needed is already in `entries` itself.
 */
export function computePlacingBadges(entries: readonly PlacingEntry[]): Map<string, PlacingBadge> {
  const minPlacingByFaction = new Map<string, number>();
  const minPlacingBySuperFaction = new Map<SuperFaction, number>();

  for (const entry of entries) {
    if (entry.placing === undefined || !entry.faction) continue;

    const currentFactionMin = minPlacingByFaction.get(entry.faction);
    if (currentFactionMin === undefined || entry.placing < currentFactionMin) {
      minPlacingByFaction.set(entry.faction, entry.placing);
    }

    const superFaction = superFactionOf(entry.faction);
    if (superFaction) {
      const currentSuperMin = minPlacingBySuperFaction.get(superFaction);
      if (currentSuperMin === undefined || entry.placing < currentSuperMin) {
        minPlacingBySuperFaction.set(superFaction, entry.placing);
      }
    }
  }

  const badges = new Map<string, PlacingBadge>();
  for (const entry of entries) {
    if (entry.placing === undefined || !entry.faction) continue;

    const badge: PlacingBadge = {};
    if (entry.placing === minPlacingByFaction.get(entry.faction)) {
      badge.bestFaction = entry.faction;
    }
    const superFaction = superFactionOf(entry.faction);
    if (superFaction && entry.placing === minPlacingBySuperFaction.get(superFaction)) {
      badge.bestSuperFaction = superFaction;
    }
    if (badge.bestFaction || badge.bestSuperFaction) {
      badges.set(entry.id, badge);
    }
  }

  return badges;
}
