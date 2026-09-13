/**
 * Looks up a board/pairing side's full roster entry (faction, disposition,
 * list, etc.) from the event's already-fetched player list by bcpUserId —
 * BCP's board/pairing payloads only carry a name + account id, not a
 * player's other already-published roster fields. Falls back to a bare
 * stand-in (carrying whatever name that payload gave) when the roster
 * doesn't have a match yet (e.g. still loading, or an unlinked player), so
 * callers can always pass the result straight to PlayerCard.
 */
export function resolveRosterPlayer(
  bcpUserId: string | undefined,
  fallbackName: string,
  players?: Player[]
): Player {
  const match = bcpUserId ? players?.find((p) => p.bcpUserId === bcpUserId) : undefined;
  return match ?? { id: bcpUserId ?? fallbackName, name: fallbackName, faction: "", bcpUserId };
}
