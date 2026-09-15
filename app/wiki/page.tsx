import PageHeader from "../components/layout/pageHeader";
import PageMain from "../components/layout/pageMain";
import Card from "../components/ui/card";
import MissionScoringDetails from "../components/shared/missionScoringDetails";
import { DISPOSITIONS, type Disposition } from "../lib/dispositions";
import { MISSION_MATRIX } from "../lib/missionMatrix";
import { SPECIAL_ACTION_DEFINITIONS } from "../lib/missionActionGlossary";
import { MISSION_SOURCES } from "../lib/missionSources";

const DISPOSITION_BLURBS: Record<Disposition, string> = {
  "Take and Hold":
    "Objective-control missions — steady per-round rewards for simply holding more ground than your opponent.",
  "Purge the Foe":
    "Kill-focused missions — VP for destroying enemy units every round, usually layered with an objective-holding or escalation bonus.",
  "Priority Assets":
    "Action-focused missions — most centre on a repeatable reverse-side action (securing assets, sabotage, vanguard operations, sensor sweeps) on top of ordinary objective holding.",
  Reconnaissance:
    "Board-presence and intel missions — reward spreading across the table, an operation-marker action (surveilling, triangulating, extracting intelligence), and objective holding.",
  Disruption:
    "Terrain and marker missions — reward controlling terrain areas, placing or denying operation markers, and (in the mirror) an escalating reward for holding ground.",
};

/**
 * A public, unguarded reference page (same pattern as /about and
 * /changelog — no useRedirectToLoginIfSignedOut, no hooks, no "use
 * client") for the mission/matchup data the "Your round" mission-matchup
 * panel (missionMatchupPanel.tsx) is built from: the 5 Force
 * Dispositions, the disposition matchup matrix, every Primary Mission's
 * full VP scoring, and the special-action glossary that fills in the
 * terms the print-sheet PDF's front faces don't define. This is
 * reference material, not tournament-format or tactical-strategy content
 * — for a specific pairing's plain-language write-up, tactics, and
 * deployment maps, see the mission-matchup panel itself (only shown for
 * singles events where both sides' dispositions are known).
 */
export default function WikiPage() {
  return (
    <div className="flex-1 bg-surface-0">
      <PageHeader
        title="Warhammer 40,000 Wiki"
        subtitle="Force Dispositions, Primary Missions, and the special-action glossary behind the mission-matchup panel."
      />
      <PageMain>
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">Force Dispositions</h2>
          <dl className="flex flex-col gap-2">
            {DISPOSITIONS.map((disposition) => (
              <div key={disposition}>
                <dt className="text-sm font-medium text-text-primary">{disposition}</dt>
                <dd className="text-sm text-text-secondary">{DISPOSITION_BLURBS[disposition]}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">Primary Mission matchup matrix</h2>
          <p className="mb-3 text-xs text-text-secondary">
            Each player&apos;s own Primary Mission is determined by (their own disposition, their
            opponent&apos;s disposition) — read your row, then your opponent&apos;s column.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-text-secondary">
                  <th scope="col" className="px-2 py-1.5 font-medium">
                    You vs. Opponent
                  </th>
                  {DISPOSITIONS.map((opponent) => (
                    <th key={opponent} scope="col" className="px-2 py-1.5 font-medium">
                      {opponent}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DISPOSITIONS.map((mine) => (
                  <tr key={mine} className="border-t border-surface-border">
                    <th scope="row" className="px-2 py-1.5 text-left font-medium text-text-primary">
                      {mine}
                    </th>
                    {DISPOSITIONS.map((opponent) => (
                      <td key={opponent} className="px-2 py-1.5 text-text-secondary">
                        {MISSION_MATRIX[mine][opponent]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {DISPOSITIONS.map((disposition) => (
          <Card key={disposition} className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-text-primary">{disposition} missions</h2>
            <div className="flex flex-col gap-1.5">
              {DISPOSITIONS.map((opponent) => {
                const missionId = MISSION_MATRIX[disposition][opponent];
                return (
                  <details key={opponent} className="text-sm">
                    <summary className="cursor-pointer font-medium text-brass-600 dark:text-brass-400">
                      {missionId} <span className="font-normal text-text-tertiary">— vs. {opponent}</span>
                    </summary>
                    <MissionScoringDetails missionId={missionId} />
                  </details>
                );
              })}
            </div>
          </Card>
        ))}

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">Special-action glossary</h2>
          <p className="mb-3 text-xs text-text-secondary">
            These are printed on the reverse side of the physical Primary Mission cards, not on
            the front faces this app otherwise transcribes from — see the source note below.
          </p>
          <dl className="flex flex-col gap-2">
            {Object.entries(SPECIAL_ACTION_DEFINITIONS).map(([term, definition]) => (
              <div key={term}>
                <dt className="text-sm font-medium capitalize text-text-primary">{term}</dt>
                <dd className="text-sm text-text-secondary">{definition}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <p className="text-xs text-text-tertiary">
          Mission data per {MISSION_SOURCES.eventCompanion.name} {MISSION_SOURCES.eventCompanion.version} (
          {MISSION_SOURCES.eventCompanion.asOf}) and {MISSION_SOURCES.printSheets.name} (
          {MISSION_SOURCES.printSheets.asOf}); special-action definitions per{" "}
          {MISSION_SOURCES.wahapediaMissionDeck.name} ({MISSION_SOURCES.wahapediaMissionDeck.asOf}, a fan
          transcription, not an official Games Workshop source) — subject to change if Games Workshop
          revises the mission pack.
        </p>
      </PageMain>
    </div>
  );
}
