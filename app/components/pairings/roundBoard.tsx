"use client";
import React from "react";
import {
  fetchItcRanking,
  fetchTeamPairingBoards,
  type BoardPairing,
  type ItcRanking,
  type TeamBoardMatchup,
} from "../../lib/bcp";
import { resolveRosterPlayer } from "../../lib/players";
import { classifyScore, SCORE_OUTCOME_CLASSES } from "../../lib/scoreColor";
import PlayerCard from "../shared/playerCard";
import PlayerStatsLink from "../shared/playerStatsLink";
import RefreshButton from "../shared/refreshButton";
import Skeleton from "../shared/skeleton";
import Spinner from "../shared/spinner";
import TeamRosterFallback from "./teamRosterFallback";
import Button from "../ui/button";
import Card from "../ui/card";
import ErrorAlert from "../ui/errorAlert";
import { useDelayedFlag } from "../../lib/useDelayedFlag";

type BoardsState = {
  loading: boolean;
  error: string | null;
  matchups: TeamBoardMatchup[];
};

type RoundBoardProps = {
  eventId: string;
  round: number;
  minRound: number;
  maxRound: number;
  entries: BoardPairing[];
  loading: boolean;
  error: string | null;
  onRoundChange: (round: number) => void;
  // Re-fetches this round's board on demand. BCP has no push/live-update
  // mechanism worth copying (see CLAUDE.md's "no polling" rule — their
  // own "live" pairings page turns out to just be a 15-second interval
  // fetch under a status light), so checking for a newly published
  // pairing is a manual, explicit action rather than something this
  // component does on its own on a timer.
  onRefresh: () => void;
  // Whether this round's entries are team-vs-team pairings — only those
  // can expand into individual boards; a singles-event row is already an
  // individual matchup.
  teamEvent: boolean;
  // BCP's current flagship ITC ranking league id — used the same way as
  // the rest of the app, to show each expanded board player's already-
  // published score/rank. Undefined/null just means it hasn't resolved
  // yet; expanded boards show no rating until it does.
  itcLeagueId?: string | null;
  // Overrides the "nothing published yet" message below — used when
  // `entries` came back empty because a search filter matched nothing,
  // rather than because BCP has nothing published for this round.
  emptyMessage?: string;
  // Each tournament team's own roster, keyed by BCP teamPlayer id (see
  // Player.teamPlayerId) — used to fall back to "who's on each team" when
  // a team-vs-team pairing is published but its individual boards aren't
  // yet, rather than showing nothing useful.
  rosterByTeamId?: Map<string, Player[]>;
  // This event's full roster — used to resolve each expanded board's
  // players to their roster entries.
  players?: Player[];
  // The signed-in account's own side1Id/side2Id-space identifier —
  // teamPlayerId for a team event, event-scoped player id for a singles
  // one. My row is highlighted, and "Jump to mine" scrolls straight to it
  // on a large board (Challengers Cup has 68 teams).
  myId?: string;
  // When `entries` was last fetched — passed straight through to
  // RefreshButton's own label. See its doc comment.
  lastSyncedAt?: number | null;
};

/**
 * The full pairings board for one round — every matchup BCP has published
 * for it, not just a single tracked team/player. Same scope rule as the
 * rest of the app: this only displays a pairing decision BCP already made
 * and published, never one this app computes.
 *
 * In a team event, clicking a team-vs-team row expands it in place to show
 * the individual board matchups underneath it (each player on one team
 * against their counterpart on the other) along with each player's
 * already-published ITC score/rank — the same information a singles-event
 * row already shows inline, just one level down. Boards (and each
 * player's ITC ranking) are only ever fetched for a pairing once it's
 * actually expanded, never for the whole round up front.
 */
// Roomy density shows each singles player's faction beside their name,
// from the roster. Team sides have no single faction, so show nothing.
function RoomyFaction({ bcpUserId, players }: { bcpUserId?: string; players?: Player[] }) {
  const faction = bcpUserId ? players?.find((p) => p.bcpUserId === bcpUserId)?.faction : undefined;
  if (!faction || faction === "Unknown") return null;
  return <span className="hidden text-xs text-text-tertiary roomy:inline">({faction})</span>;
}

export default function RoundBoard({
  eventId,
  round,
  minRound,
  maxRound,
  entries,
  loading,
  error,
  onRoundChange,
  onRefresh,
  teamEvent,
  itcLeagueId,
  emptyMessage,
  rosterByTeamId,
  players,
  myId,
  lastSyncedAt,
}: RoundBoardProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [boardsById, setBoardsById] = React.useState<Record<string, BoardsState>>({});
  // Read by the effects below without re-running them on every change.
  const expandedRef = React.useRef(expanded);
  const boardsRef = React.useRef(boardsById);
  React.useEffect(() => {
    expandedRef.current = expanded;
    boardsRef.current = boardsById;
  }, [expanded, boardsById]);
  const [itcByUserId, setItcByUserId] = React.useState<Record<string, ItcRanking | null>>({});
  const requestedItcIdsRef = React.useRef<Set<string>>(new Set());
  const slowLoad = useDelayedFlag(loading);
  const rowRefs = React.useRef<Map<string, HTMLLIElement>>(new Map());

  const myEntry = myId ? entries.find((e) => e.side1Id === myId || e.side2Id === myId) : undefined;
  const jumpToMine = () => {
    if (!myEntry) return;
    rowRefs.current.get(myEntry.id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const loadItcFor = React.useCallback(
    (userIds: Iterable<string>) => {
      if (!itcLeagueId) return;
      Array.from(new Set(userIds)).forEach((userId) => {
        if (requestedItcIdsRef.current.has(userId)) return;
        requestedItcIdsRef.current.add(userId);
        fetchItcRanking(userId, itcLeagueId)
          .then((ranking) => {
            setItcByUserId((prev) => ({ ...prev, [userId]: ranking }));
          })
          .catch(() => {
            requestedItcIdsRef.current.delete(userId);
          });
      });
    },
    [itcLeagueId]
  );

  const fetchBoard = React.useCallback(
    (entry: BoardPairing) => {
      setBoardsById((prev) => ({
        ...prev,
        [entry.id]: { loading: true, error: null, matchups: [] },
      }));

      fetchTeamPairingBoards(eventId, round, entry.id)
        .then((matchups) => {
          setBoardsById((prev) => ({ ...prev, [entry.id]: { loading: false, error: null, matchups } }));
          if (matchups.length > 0) {
            loadItcFor(
              matchups.flatMap((m) => [m.player1UserId, m.player2UserId].filter((id): id is string => Boolean(id)))
            );
          } else {
            // No individual boards yet — fall back to showing each side's
            // roster instead, so their ITC ratings are still worth fetching.
            const side1Roster = entry.side1Id ? rosterByTeamId?.get(entry.side1Id) ?? [] : [];
            const side2Roster = entry.side2Id ? rosterByTeamId?.get(entry.side2Id) ?? [] : [];
            loadItcFor(
              [...side1Roster, ...side2Roster]
                .map((p) => p.bcpUserId)
                .filter((id): id is string => Boolean(id))
            );
          }
        })
        .catch((err) => {
          setBoardsById((prev) => ({
            ...prev,
            [entry.id]: {
              loading: false,
              // A generic fallback, not "Failed to load boards" — this
              // always renders after an existing "Couldn't load boards:"
              // prefix (see the render below), so a fallback that repeats
              // "load boards" read as a stutter.
              error: err instanceof Error ? err.message : "an unknown error",
              matchups: [],
            },
          }));
        });
    },
    [eventId, round, rosterByTeamId, loadItcFor]
  );

  const toggleExpand = (entry: BoardPairing) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(entry.id)) {
        next.delete(entry.id);
        return next;
      }
      next.add(entry.id);
      return next;
    });
    // Fetched once, but a failed fetch is retried on the next expand.
    const existing = boardsById[entry.id];
    if (existing && !existing.error) return;
    fetchBoard(entry);
  };

  // When the round's pairings come back (a refresh, or a new round), the
  // boards cached for it may be stale: re-fetch the rows that are open
  // and forget the rest.
  React.useEffect(() => {
    Promise.resolve().then(() => {
      setBoardsById({});
      entries.filter((e) => expandedRef.current.has(e.id)).forEach(fetchBoard);
    });
    // Keyed on entries only; fetchBoard's own inputs don't mean the
    // pairings changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // Boards loaded before the ITC league resolved got no ranks; look them
  // up once it does.
  React.useEffect(() => {
    if (!itcLeagueId) return;
    loadItcFor(
      Object.values(boardsRef.current).flatMap((b) =>
        b.matchups.flatMap((m) => [m.player1UserId, m.player2UserId].filter((id): id is string => Boolean(id)))
      )
    );
  }, [itcLeagueId, loadItcFor]);


  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-surface-border bg-surface-2 px-4 py-3">
        <p className="font-semibold text-text-primary">Round pairings</p>
        <div className="flex items-center gap-2">
          {myEntry && (
            <Button variant="ghost" size="sm" onClick={jumpToMine}>
              Jump to mine
            </Button>
          )}
          <RefreshButton
            onRefresh={onRefresh}
            loading={loading}
            label="pairings"
            lastSyncedAt={lastSyncedAt}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRoundChange(round - 1)}
            disabled={round <= minRound}
            aria-label="Previous round"
          >
            ‹
          </Button>
          <span className="min-w-[5.5rem] text-center text-sm font-medium text-text-primary">
            Round {round}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRoundChange(round + 1)}
            disabled={round >= maxRound}
            aria-label="Next round"
          >
            ›
          </Button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto p-3">
        {error && <ErrorAlert size="sm">Couldn&apos;t load round {round}: {error}</ErrorAlert>}

        {!error && loading && (
          <div className="p-2" aria-live="polite">
            <span className="sr-only">Loading round {round}…</span>
            <div className="flex flex-col gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
            {slowLoad && (
              <p className="mt-2 text-xs text-text-tertiary">
                Taking longer than usual — first look at this round.
              </p>
            )}
          </div>
        )}

        {!error && !loading && entries.length === 0 && (
          <p className="p-2 text-sm text-text-secondary">
            {emptyMessage ?? `No pairings published yet for round ${round}.`}
          </p>
        )}

        {!error && !loading && entries.length > 0 && (
          <ul className="animate-fade-in flex flex-col gap-1.5">
            {entries.map((entry) => {
              const side1Mine = Boolean(myId && entry.side1Id === myId);
              const side2Mine = Boolean(myId && entry.side2Id === myId);
              const isMine = side1Mine || side2Mine;
              const canExpand = teamEvent && !entry.isBye;
              const isExpanded = canExpand && expanded.has(entry.id);
              const boardState = boardsById[entry.id];

              // Color the final score from my side on my row, so it reads
              // as "am I winning"; otherwise from side1 (an arbitrary but
              // consistent anchor).
              const scoreOutcome =
                entry.side1Score !== undefined && entry.side2Score !== undefined
                  ? classifyScore(
                      side2Mine ? entry.side2Score : entry.side1Score,
                      side2Mine ? entry.side1Score : entry.side2Score
                    )
                  : undefined;

              return (
                <li
                  key={entry.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(entry.id, el);
                    else rowRefs.current.delete(entry.id);
                  }}
                  className={`rounded-md border text-sm ${
                    isMine ? "border-brass-500/40 bg-brass-500/10" : "border-surface-border"
                  }`}
                >
                  <div
                    role={canExpand ? "button" : undefined}
                    tabIndex={canExpand ? 0 : undefined}
                    aria-expanded={canExpand ? isExpanded : undefined}
                    onClick={canExpand ? () => toggleExpand(entry) : undefined}
                    onKeyDown={
                      canExpand
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleExpand(entry);
                            }
                          }
                        : undefined
                    }
                    className={`flex flex-wrap items-center gap-x-3 gap-y-1 p-2 ${
                      canExpand ? "cursor-pointer" : ""
                    }`}
                  >
                    <span className="w-12 shrink-0 text-xs font-medium text-text-tertiary">
                      {entry.table ? `Tbl ${entry.table}` : ""}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-text-primary">
                      <span className={side1Mine ? "font-semibold" : undefined}>
                        <PlayerStatsLink name={entry.side1Name} bcpUserId={entry.side1UserId} />
                      </span>
                      <RoomyFaction bcpUserId={entry.side1UserId} players={players} />
                      <span className="text-text-tertiary">vs</span>
                      <span className={side2Mine ? "font-semibold" : undefined}>
                        <PlayerStatsLink name={entry.side2Name} bcpUserId={entry.side2UserId} />
                      </span>
                      <RoomyFaction bcpUserId={entry.side2UserId} players={players} />
                    </span>
                    {!entry.published ? (
                      <span className="shrink-0 text-xs text-text-tertiary">
                        unpublished
                      </span>
                    ) : entry.isDone ? (
                      scoreOutcome ? (
                        <span
                          className={`shrink-0 text-xs font-medium ${SCORE_OUTCOME_CLASSES[scoreOutcome]}`}
                        >
                          {entry.side1Score}–{entry.side2Score}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-success-400">
                          done
                        </span>
                      )
                    ) : (
                      <span className="shrink-0 text-xs text-warning-400">
                        <span className="compact:hidden">in progress</span>
                        <span
                          aria-label="in progress"
                          title="in progress"
                          className="hidden h-2 w-2 rounded-full bg-warning-400 compact:inline-block"
                        />
                      </span>
                    )}
                    {canExpand && (
                      <span
                        aria-hidden
                        className="shrink-0 text-xs text-text-tertiary"
                      >
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="flex flex-col gap-1 border-t border-surface-border px-2 pb-2 pt-1.5">
                      {boardState?.loading && (
                        <div className="flex items-center gap-1.5 px-1 py-1 text-xs text-text-secondary">
                          <Spinner size="sm" />
                          <span>Loading boards…</span>
                        </div>
                      )}
                      {boardState?.error && (
                        <p className="px-1 py-1 text-xs text-danger-400">
                          Couldn&apos;t load boards: {boardState.error}
                        </p>
                      )}
                      {boardState && !boardState.loading && !boardState.error &&
                        boardState.matchups.length === 0 &&
                        (() => {
                          const side1Roster = entry.side1Id ? rosterByTeamId?.get(entry.side1Id) : undefined;
                          const side2Roster = entry.side2Id ? rosterByTeamId?.get(entry.side2Id) : undefined;
                          return side1Roster?.length || side2Roster?.length ? (
                            <TeamRosterFallback
                              side1Name={entry.side1Name}
                              side1Players={side1Roster ?? []}
                              side2Name={entry.side2Name}
                              side2Players={side2Roster ?? []}
                              itcByUserId={itcByUserId}
                              itcLeagueId={itcLeagueId}
                            />
                          ) : (
                            <p className="px-1 py-1 text-xs text-text-secondary">
                              No individual boards published for this matchup yet.
                            </p>
                          );
                        })()}
                      {boardState?.matchups.map((m, mi) => (
                        <div
                          key={mi}
                          className="rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 pb-1">
                            <span className="text-text-tertiary">
                              {m.table ? `Board ${m.table}` : "Board"}
                            </span>
                            {m.player1Score !== undefined && m.player2Score !== undefined && (
                              <span
                                className={`font-medium ${
                                  SCORE_OUTCOME_CLASSES[classifyScore(m.player1Score, m.player2Score)]
                                }`}
                              >
                                {m.player1Score}–{m.player2Score}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <PlayerCard
                              player={resolveRosterPlayer(m.player1UserId, m.player1Name, players)}
                              ranking={m.player1UserId ? itcByUserId[m.player1UserId] : undefined}
                              itcLeagueId={itcLeagueId}
                            />
                            <PlayerCard
                              player={resolveRosterPlayer(m.player2UserId, m.player2Name, players)}
                              ranking={m.player2UserId ? itcByUserId[m.player2UserId] : undefined}
                              itcLeagueId={itcLeagueId}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
