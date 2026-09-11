"use client";
import type { PlacingEntry } from "../../lib/bcp";
import Spinner from "../shared/spinner";
import Card from "../ui/card";
import ErrorAlert from "../ui/errorAlert";
import { useDelayedFlag } from "../../lib/useDelayedFlag";

type PlacingsTableProps = {
  entries: PlacingEntry[];
  loading: boolean;
  error: string | null;
  followedIds?: Set<string>;
  // Overrides the "nothing published yet" message below — used when
  // `entries` came back empty because a search filter matched nothing,
  // rather than because BCP has no placings published yet.
  emptyMessage?: string;
};

/**
 * Standings as BCP has already computed and published them. The metric
 * columns are whatever BCP reports for this event (e.g. Wins, Battle
 * Points, Wins SoS) rather than hardcoded — this only displays published
 * numbers, it doesn't calculate them.
 */
export default function PlacingsTable({
  entries,
  loading,
  error,
  followedIds,
  emptyMessage,
}: PlacingsTableProps) {
  const metricNames = entries[0]?.metrics.map((m) => m.name) ?? [];
  const slowLoad = useDelayedFlag(loading);

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="border-b border-surface-border bg-surface-2 px-4 py-3">
        <p className="font-semibold text-text-primary">Placings</p>
      </div>

      <div className="p-3">
        {error && <ErrorAlert size="sm">Couldn&apos;t load placings: {error}</ErrorAlert>}

        {!error && loading && (
          <div className="p-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Spinner size="sm" />
              <span>Loading placings…</span>
            </div>
            {slowLoad && (
              <p className="mt-1 text-xs text-text-tertiary">
                Taking longer than usual — first look at this event.
              </p>
            )}
          </div>
        )}

        {!error && !loading && entries.length === 0 && (
          <p className="p-2 text-sm text-text-secondary">
            {emptyMessage ??
              "No placings published yet — this usually appears once a round or two has finished."}
          </p>
        )}

        {!error && !loading && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-text-secondary">
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">Name</th>
                  {metricNames.map((name) => (
                    <th key={name} className="px-2 py-1.5 text-right font-medium">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`border-t border-surface-border ${
                      followedIds?.has(entry.id) ? "bg-brass-500/10" : ""
                    }`}
                  >
                    <td className="px-2 py-1.5 text-text-secondary">
                      {entry.placing ?? "—"}
                    </td>
                    <td className="truncate px-2 py-1.5 font-medium text-text-primary">
                      {entry.name}
                    </td>
                    {metricNames.map((name) => (
                      <td
                        key={name}
                        className="px-2 py-1.5 text-right text-text-secondary"
                      >
                        {entry.metrics.find((m) => m.name === name)?.value ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
