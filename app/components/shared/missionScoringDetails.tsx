import type { MissionId } from "../../lib/missions";
import { MISSION_SCORING, type MissionScoring } from "../../lib/missionScoring";
import { SPECIAL_ACTION_DEFINITIONS } from "../../lib/missionActionGlossary";

type MissionScoringDetailsProps = { missionId: MissionId };

/**
 * The full VP-scoring breakdown for one Primary Mission — setup text,
 * every scoring band and condition, and (if any) the special-action
 * definitions its conditions cite. Shared by missionMatchupPanel.tsx
 * (wrapped in its own per-pairing `<details>`) and the `/wiki` page
 * (wrapped in a per-mission `<details>` of its own) so the rendering
 * itself only lives in one place. A plain hookless component — testable
 * via renderToStaticMarkup like everything else in this project.
 */
export default function MissionScoringDetails({ missionId }: MissionScoringDetailsProps) {
  const scoring: MissionScoring = MISSION_SCORING[missionId];
  return (
    <div className="mt-2 flex flex-col gap-2 border-l-2 border-surface-border pl-3">
      {scoring.setup && <p className="text-xs italic text-text-secondary">{scoring.setup}</p>}
      {scoring.bands.map((band, i) => (
        // Index included: some missions (e.g. Death Trap, Reconnaissance
        // Sweep) have two separate bands sharing the same `when` text, so
        // that text alone isn't a unique key.
        <div key={`${band.when}-${i}`}>
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
      {scoring.specialTerms && scoring.specialTerms.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-surface-border pt-1.5">
          {scoring.specialTerms.map((term) => (
            <p key={term} className="text-xs text-text-tertiary">
              <span className="font-medium capitalize text-text-secondary">{term}: </span>
              {SPECIAL_ACTION_DEFINITIONS[term]}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
