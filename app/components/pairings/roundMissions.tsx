"use client";
import React, { useId, useState } from "react";
import { DISPOSITIONS, isDisposition, type Disposition } from "../../lib/dispositions";
import PlayerStatsPanel from "../myEvents/playerStatsPanel";
import MissionMatchupPanel from "./missionMatchupPanel";
import { possessive } from "../../lib/spectating";

const SELECT_CLASSES =
  "min-h-8 rounded-md border border-surface-border bg-surface-1 px-2 py-1 text-sm text-text-primary focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/20";

type RoundMissionsProps = {
  myDisposition?: Disposition;
  opponentDisposition?: Disposition;
  opponentBcpUserId: string;
  opponentName: string;
  // The followed player's name, when a spectator is viewing their round.
  subjectName?: string;
};

/**
 * The lower half of Your round: this pairing's missions when both Force
 * Dispositions are known, otherwise the opponent's stats. A player who
 * never set a disposition on BCP has none in the roster, so for that case
 * this offers a picker (the players can just ask each other) and shows
 * the missions once both are chosen. The choice lives only in this
 * component; the caller keys it by opponent so a new pairing starts fresh.
 */
export default function RoundMissions({
  myDisposition,
  opponentDisposition,
  opponentBcpUserId,
  opponentName,
  subjectName,
}: RoundMissionsProps) {
  const [pickedMine, setPickedMine] = useState<Disposition | undefined>();
  const [pickedTheirs, setPickedTheirs] = useState<Disposition | undefined>();
  const mineId = useId();
  const theirsId = useId();

  const mine = myDisposition ?? pickedMine;
  const theirs = opponentDisposition ?? pickedTheirs;
  const missing = !myDisposition || !opponentDisposition;

  const picker = missing && (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-surface-border p-3 text-sm">
      <p className="text-text-secondary">
        {!opponentDisposition && !myDisposition
          ? "Neither of you has a Force Disposition on Best Coast Pairings."
          : !opponentDisposition
            ? `${opponentName} hasn't set a Force Disposition on Best Coast Pairings.`
            : subjectName
              ? `${subjectName} hasn't set a Force Disposition on Best Coast Pairings.`
              : "You haven't set a Force Disposition on Best Coast Pairings."}{" "}
        Pick {!myDisposition && !opponentDisposition ? "both" : "it"} to see this round&apos;s missions.
      </p>
      <div className="flex flex-wrap gap-3">
        {!myDisposition && (
          <label htmlFor={mineId} className="flex items-center gap-1.5 text-text-secondary">
            {subjectName ? possessive(subjectName) : "Yours"}
            <select
              id={mineId}
              value={pickedMine ?? ""}
              onChange={(e) => setPickedMine(isDisposition(e.target.value) ? e.target.value : undefined)}
              className={SELECT_CLASSES}
            >
              <option value="">Choose…</option>
              {DISPOSITIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
        {!opponentDisposition && (
          <label htmlFor={theirsId} className="flex items-center gap-1.5 text-text-secondary">
            Theirs
            <select
              id={theirsId}
              value={pickedTheirs ?? ""}
              onChange={(e) => setPickedTheirs(isDisposition(e.target.value) ? e.target.value : undefined)}
              className={SELECT_CLASSES}
            >
              <option value="">Choose…</option>
              {DISPOSITIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {picker}
      {mine && theirs ? (
        <MissionMatchupPanel
          myDisposition={mine}
          opponentDisposition={theirs}
          myLabel={subjectName ? `${possessive(subjectName)} mission` : undefined}
        />
      ) : (
        <PlayerStatsPanel mode="player" bcpUserId={opponentBcpUserId} playerName={opponentName} />
      )}
    </div>
  );
}
