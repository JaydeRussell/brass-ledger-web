// Whose point of view the event page shows, and what it offers someone who
// isn't playing. Pure functions of data the page already holds.

import { eventStatus } from "./follow.ts";

export type Perspective = {
  /** The viewer's own roster entry, from their linked BCP profile. */
  ownPlayer?: Player;
  /** The player being followed, when there is one on this roster. */
  followedPlayer?: Player;
  /** Whose round and team the page shows. */
  subject?: Player;
  /** True when `subject` is someone other than the viewer. */
  spectating: boolean;
};

/**
 * Someone on the roster always sees their own view unless they switch to
 * the player they follow, so registering for a followed event makes it
 * theirs.
 */
export function resolvePerspective(
  players: Player[],
  ownBcpUserId: string | undefined,
  followedPlayerId: string | null,
  viewAsFollowed: boolean
): Perspective {
  const ownPlayer = ownBcpUserId ? players.find((p) => p.bcpUserId === ownBcpUserId) : undefined;
  const found = followedPlayerId ? players.find((p) => String(p.id) === followedPlayerId) : undefined;
  const followedPlayer = found && found !== ownPlayer ? found : undefined;
  const spectating = followedPlayer !== undefined && (ownPlayer === undefined || viewAsFollowed);
  return { ownPlayer, followedPlayer, subject: spectating ? followedPlayer : ownPlayer, spectating };
}

/** Join goes to BCP's registration, which only makes sense for an event still to come. */
export function canJoin(
  eventInfo: { started: boolean; ended: boolean; startDate?: string; endDate?: string } | null,
  ownPlayer: Player | undefined,
  now: Date = new Date()
): boolean {
  return eventInfo !== null && eventStatus(eventInfo, now) === "Upcoming" && ownPlayer === undefined;
}

/** Why the Mine tab has no round to show. */
export function mineEmptyMessage(opts: {
  /** The page is on a followed player's side rather than the viewer's. */
  showingFollowed: boolean;
  followedName?: string;
  /** The followed player has left the roster. */
  followedMissing: boolean;
  linked: boolean;
  onRoster: boolean;
}): string {
  if (opts.showingFollowed) {
    if (opts.followedMissing) return "The player you're following is no longer on this event's roster.";
    const whose = opts.followedName ? possessive(opts.followedName) : "Their";
    return `${whose} round will show here once the event starts.`;
  }
  if (!opts.linked) return "Link your BCP profile on the My Events page to see your round here.";
  if (!opts.onRoster) return "Your linked BCP profile isn't on this event's roster.";
  return "Your round will show here once the event starts.";
}

/** "Olive's" from a full name, for headings like "Olive's round". */
export function possessive(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] || fullName;
  return first.endsWith("s") ? `${first}'` : `${first}'s`;
}
