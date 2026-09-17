"use client";
import type { ReactNode } from "react";
import type { MyPairing } from "../../lib/bcp";
import { classifyScore, SCORE_OUTCOME_CLASSES } from "../../lib/scoreColor";
import Badge from "../ui/badge";
import DispositionBadge from "../shared/dispositionBadge";
import PlayerStatsLink from "../shared/playerStatsLink";
import RoundScoreStrip from "../shared/roundScoreStrip";
import Card from "../ui/card";
import ErrorAlert from "../ui/errorAlert";
import Skeleton from "../shared/skeleton";

export type TeammateEntry = {
  player: Player;
  pairings: MyPairing[];
  loading: boolean;
  error: string | null;
  // This event's already-published overall standing, when BCP has
  // computed one (see app/lib/bcp.ts's PlacingEntry) — undefined until
  // at least one round has finished. Sorts the list (see MyTeamPanel
  // below) and shows as a "#N" badge next to each name.
  placing?: number;
};

type MyTeamPanelProps = {
  teammates: TeammateEntry[];
  // This event's full roster — resolves each shown opponent's already-
  // published disposition, the one piece of opponent detail kept in this
  // deliberately trimmed-down view (see this file's own doc comment).
  players?: Player[];
  // The signed-in account's own player id, so their row can be marked
  // "(you)" — myTeammates always includes them alongside actual
  // teammates (see app/page.tsx).
  myPlayerId?: string | number;
};

function latestPublished(pairings: MyPairing[]): MyPairing | undefined {
  for (let i = pairings.length - 1; i >= 0; i--) {
    if (pairings[i].published) return pairings[i];
  }
  return undefined;
}

/** One round, as a bold "who won" line plus a single muted context line
 * below it — deliberately just table/opponent/disposition, no faction
 * text, list link, or ITC badge (all still one click away via the
 * opponent's own name/stats link) — the whole point being a row you can
 * actually skim down a list of teammates at, not read word by word.
 * `trailing` overrides the default single-round score on the right —
 * used for the summary row's full round-score-strip "record" — falling
 * back to that plain score for a plain history row. */
function RoundLine({
  primary,
  pairing,
  players,
  trailing,
}: {
  primary: ReactNode;
  pairing?: MyPairing;
  players?: Player[];
  trailing?: ReactNode;
}) {
  const opponentDisposition = pairing?.opponentUserId
    ? players?.find((p) => p.bcpUserId === pairing.opponentUserId)?.disposition
    : undefined;

  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{primary}</p>
        {pairing?.published ? (
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-text-secondary">
            <span className="min-w-0 truncate">
              vs <PlayerStatsLink name={pairing.opponentName} bcpUserId={pairing.opponentUserId} />
              {pairing.table && ` · Table ${pairing.table}`}
            </span>
            <DispositionBadge disposition={opponentDisposition} />
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-text-tertiary">Not published yet</p>
        )}
      </div>
      {trailing !== undefined
        ? trailing
        : pairing?.myScore !== undefined &&
          pairing?.opponentScore !== undefined && (
            <span
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                SCORE_OUTCOME_CLASSES[classifyScore(pairing.myScore, pairing.opponentScore)]
              }`}
            >
              {pairing.myScore}–{pairing.opponentScore}
            </span>
          )}
    </div>
  );
}

function TeammateRow({ entry, players, isSelf }: { entry: TeammateEntry; players?: Player[]; isSelf: boolean }) {
  const { player, pairings, loading, error, placing } = entry;
  const current = latestPublished(pairings);
  // Every other round besides the one already shown in the summary line
  // — newest first, since that's the order you'd actually want to skim.
  const history = [...pairings].filter((p) => p.round !== current?.round).reverse();
  const publishedPairings = pairings.filter((p) => p.published);

  const nameLine = (
    <>
      {placing !== undefined && <Badge tone="neutral" className="mr-1.5">{`#${placing}`}</Badge>}
      <PlayerStatsLink name={player.name} bcpUserId={player.bcpUserId} />
      {isSelf && <span className="ml-1.5 font-normal text-text-tertiary">(you)</span>}
    </>
  );

  if (error) {
    return (
      <li className="rounded-md border border-surface-border p-2.5">
        <p className="text-sm font-medium text-text-primary">{nameLine}</p>
        <ErrorAlert size="sm">Couldn&apos;t load pairings: {error}</ErrorAlert>
      </li>
    );
  }

  if (loading) {
    return (
      <li className="rounded-md border border-surface-border p-2.5">
        <p className="mb-1.5 text-sm font-medium text-text-primary">{nameLine}</p>
        <Skeleton className="h-9 w-full" />
      </li>
    );
  }

  return (
    <li className="rounded-md border border-surface-border text-sm">
      <RoundLine
        primary={nameLine}
        pairing={current}
        players={players}
        trailing={publishedPairings.length > 0 ? <RoundScoreStrip pairings={publishedPairings} /> : undefined}
      />
      {history.length > 0 && (
        <details className="border-t border-surface-border">
          <summary className="cursor-pointer select-none px-3 py-1.5 text-xs text-text-tertiary hover:text-text-secondary">
            {history.length} earlier round{history.length === 1 ? "" : "s"}
          </summary>
          <ul className="flex flex-col divide-y divide-surface-border">
            {history.map((p) => (
              <li key={p.round}>
                <RoundLine primary={`Round ${p.round}`} pairing={p} players={players} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}

/**
 * "Where's my team right now" — yourself plus every other player sharing
 * your own BCP-registered club in a singles event (see app/page.tsx's
 * `myTeammates`: BCP lets players self-declare a shared club/team
 * specifically so its pairing algorithm avoids pairing them in early
 * rounds, the same field this app already showed as a parenthetical
 * "(club)" on every player card — this just groups by it, plus you).
 * Sorted by this event's already-published overall standing (best
 * placing first; not yet placed sorts last), tie-broken by current-round
 * table number — reads like a leaderboard of just your crew rather than
 * roster order, and that placing shows as a "#N" badge next to each name
 * so it isn't just a sort key. One row per teammate: their placing, full
 * round-by-round record (the same score strip Placings shows — see
 * roundScoreStrip.tsx), and current round's opponent/table at a glance,
 * expandable to every earlier round's own opponent/table. Deliberately
 * spare otherwise — a first pass showed everything MyPairings shows per
 * round (faction, list link, both sides' ITC), which reads fine for one
 * followed player but turns into a wall of text across a dozen
 * teammates; this keeps only what you actually skim for (who, where,
 * how it's gone overall), leaving the rest a click away on each name.
 * Purely a display of already-published BCP data, same scope as
 * MyPairings/Placings — nothing here is computed.
 */
export default function MyTeamPanel({ teammates, players, myPlayerId }: MyTeamPanelProps) {
  if (teammates.length === 0) return null;

  const sorted = [...teammates].sort((a, b) => {
    if (a.placing !== b.placing) {
      if (a.placing === undefined) return 1;
      if (b.placing === undefined) return -1;
      return a.placing - b.placing;
    }
    const tableA = latestPublished(a.pairings)?.table;
    const tableB = latestPublished(b.pairings)?.table;
    if (tableA === tableB) return 0;
    if (tableA === undefined) return 1;
    if (tableB === undefined) return -1;
    return tableA - tableB;
  });

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="border-b border-surface-border bg-surface-2 px-4 py-3">
        <p className="font-semibold text-text-primary">Your team</p>
        <p className="text-sm text-text-secondary">{teammates[0].player.homeClub} players at this event</p>
      </div>
      <ul className="flex flex-col gap-2 p-3">
        {sorted.map((entry) => (
          <TeammateRow
            key={entry.player.id}
            entry={entry}
            players={players}
            isSelf={myPlayerId !== undefined && entry.player.id === myPlayerId}
          />
        ))}
      </ul>
    </Card>
  );
}
