import type { Disposition } from "../../lib/dispositions";
import { getPrimaryMission } from "../../lib/missionMatrix";
import { MISSION_SCORING, type MissionScoring } from "../../lib/missionScoring";
import { getMissionMatchup, deploymentMapImages } from "../../lib/missionMatchups";
import { MISSION_SOURCES } from "../../lib/missionSources";
import type { MissionId } from "../../lib/missions";

type MissionMatchupPanelProps = {
  myDisposition: Disposition;
  opponentDisposition: Disposition;
};

/** One mission's full VP-scoring breakdown, collapsed by default — a
 * native <details>/<summary> disclosure rather than a useState toggle, so
 * this stays a plain hookless component (testable via testUtils.ts's
 * walk/find, same as dispositionBadge.tsx) and gets expand/collapse for
 * free with no JS. */
function MissionRules({ label, missionId }: { label: string; missionId: MissionId }) {
  const scoring: MissionScoring = MISSION_SCORING[missionId];
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-brass-600 dark:text-brass-400">
        {label}: {missionId} — full rules
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-l-2 border-surface-border pl-3">
        {scoring.setup && <p className="text-xs italic text-text-secondary">{scoring.setup}</p>}
        {scoring.bands.map((band) => (
          <div key={band.when}>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{band.when}</p>
            <ul className="mt-0.5 flex flex-col">
              {band.conditions.map((condition) => (
                <li
                  key={condition.text}
                  className="flex items-baseline justify-between gap-2 border-b border-surface-border py-1 text-text-secondary"
                >
                  <span>
                    {condition.cumulative && <span className="text-text-tertiary">+ </span>}
                    {condition.text}
                  </span>
                  <span className="shrink-0 font-medium text-text-primary">{condition.vp}VP</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

/**
 * "Your round"'s singles-event replacement for PlayerStatsPanel: given both
 * players' Force Dispositions, looks up each side's actual Primary Mission
 * (missionMatrix.ts, from the Warhammer Event Companion's disposition
 * matrix), a plain-language matchup summary and tactical suggestions
 * (missionMatchups.ts, hand-authored), each side's full VP-scoring rules
 * (missionScoring.ts, transcribed from the Primary Missions Print Sheets),
 * and the three alternate deployment-map layouts for this pairing. All
 * static/precomputed — no fetch, nothing to keep in sync live. See
 * myRoundCard.tsx for the gating (singles events only, both dispositions
 * known) that decides when this renders instead of PlayerStatsPanel.
 */
export default function MissionMatchupPanel({ myDisposition, opponentDisposition }: MissionMatchupPanelProps) {
  const myMission = getPrimaryMission(myDisposition, opponentDisposition);
  const opponentMission = getPrimaryMission(opponentDisposition, myDisposition);
  const matchup = getMissionMatchup(myDisposition, opponentDisposition);
  const layouts = deploymentMapImages(myDisposition, opponentDisposition);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 text-sm">
        <p>
          <span className="text-text-tertiary">Your mission: </span>
          <span className="font-semibold text-text-primary">{myMission}</span>
        </p>
        <p>
          <span className="text-text-tertiary">Their mission: </span>
          <span className="font-semibold text-text-primary">{opponentMission}</span>
        </p>
      </div>

      <p className="text-sm text-text-secondary">{matchup.summary}</p>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">How to play it out</p>
        <ul className="mt-1 flex list-disc flex-col gap-1 pl-4 text-sm text-text-secondary">
          {matchup.tactics.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1.5">
        <MissionRules label="Your mission" missionId={myMission} />
        <MissionRules label="Their mission" missionId={opponentMission} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Deployment layouts</p>
        <div className="mt-1.5 flex gap-2">
          {layouts.map((layout) => (
            <a
              key={layout.layout}
              href={layout.src}
              target="_blank"
              rel="noreferrer"
              className="flex-1 overflow-hidden rounded-md border border-surface-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a
                  pre-cropped local static asset, not a remote/optimizable
                  image (see the plan's rationale for skipping next/image). */}
              <img src={layout.src} alt={`Layout ${layout.layout} for this deployment`} className="w-full" />
              <span className="block bg-surface-2 py-0.5 text-center text-xs text-text-secondary">
                Layout {layout.layout}
              </span>
            </a>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-tertiary">
        Mission rules per {MISSION_SOURCES.eventCompanion.name} {MISSION_SOURCES.eventCompanion.version} (
        {MISSION_SOURCES.eventCompanion.asOf}) and {MISSION_SOURCES.printSheets.name} (
        {MISSION_SOURCES.printSheets.asOf}) — subject to change if Games Workshop revises the mission pack.
      </p>
    </div>
  );
}
