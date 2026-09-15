"use client";
import { useState } from "react";
import { DISPOSITIONS, type Disposition } from "../../lib/dispositions";
import MissionMatchupPanel from "../pairings/missionMatchupPanel";

const SELECT_CLASSES =
  "rounded-md border border-surface-border bg-surface-1 px-2 py-1.5 text-sm text-text-primary focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/20";

/**
 * An interactive version of the wiki's static matchup matrix/mission
 * tables above — pick any two Force Dispositions and see the exact same
 * write-up, tactics, VP scoring, and deployment maps the "Your round"
 * mission-matchup panel shows for a real live pairing
 * (missionMatchupPanel.tsx), without needing to actually be in one.
 * MissionMatchupPanel itself takes just the two dispositions as props —
 * no pairing/BCP data involved — so this is purely local UI state over
 * data this page already has.
 */
export default function MatchupLookup() {
  const [mine, setMine] = useState<Disposition>(DISPOSITIONS[0]);
  const [theirs, setTheirs] = useState<Disposition>(DISPOSITIONS[0]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1.5">
          <span className="text-text-secondary">Your disposition:</span>
          <select
            value={mine}
            onChange={(e) => setMine(e.target.value as Disposition)}
            className={SELECT_CLASSES}
          >
            {DISPOSITIONS.map((disposition) => (
              <option key={disposition} value={disposition}>
                {disposition}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-text-secondary">Their disposition:</span>
          <select
            value={theirs}
            onChange={(e) => setTheirs(e.target.value as Disposition)}
            className={SELECT_CLASSES}
          >
            {DISPOSITIONS.map((disposition) => (
              <option key={disposition} value={disposition}>
                {disposition}
              </option>
            ))}
          </select>
        </label>
      </div>

      <MissionMatchupPanel myDisposition={mine} opponentDisposition={theirs} />
    </div>
  );
}
