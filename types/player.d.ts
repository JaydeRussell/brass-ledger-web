// Deliberately minimal: no matchup score, no pairing state. Challengers Cup
// bans algorithms/methodology "for the pairings process" (see the AI
// Assisted Pairings rule in the event pack) — so this app only displays
// public roster data pulled from BCP. It doesn't rank, score, or suggest
// pairings, and it shouldn't grow fields that would let it start doing so.
type Player = {
  id: string | number;
  name: string;
  faction: string;
  subFaction?: string;
  // 40k 11th edition's Force Disposition (Take and Hold / Purge the Foe /
  // Disruption / Reconnaissance / Priority Assets) — only present for
  // events using that mission system. BCP has no dedicated field for
  // this; the backend derives it from subFaction when that value is an
  // exact match for one of the five, leaving subFaction itself untouched
  // for every other event (see internal/bcp/types.go's forceDispositions
  // on the backend for the full story).
  disposition?: string;
  // The tournament team this player is playing under, if this event has
  // teams at all (absent for singles/individual events).
  team?: string;
  // Internal BCP id for that tournament-team record — needed to look up
  // team-vs-team pairings later, not meant for display.
  teamPlayerId?: string;
  homeClub?: string; // the player's personal/home BCP club, if different
  list?: string;
  // BCP's global (cross-event) account id for this person — lets the UI
  // link to their public BCP profile, where their already-published ITC
  // ranking points live. Not meant for display itself.
  bcpUserId?: string;
};

type Opponent = Player;
