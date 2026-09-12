"use client";
import React from "react";
import type { PlacingHistoryPoint } from "../../lib/myStats";

type PlacingTrendChartProps = {
  // Chronological (oldest first) — see PlacingHistoryPoint's doc comment.
  points: PlacingHistoryPoint[];
};

// "ITC points earned" was considered and dropped: BCP doesn't publish a
// per-event ITC-points value anywhere (confirmed live against both the
// placings-history and event-placings endpoints — the only per-event
// score BCP has is its own internal battle-points/format score, already
// carried as `points` below and shown only in the tooltip/table, never
// plotted, since it isn't comparable across different scoring formats).
// ITC points only exist as a live, league-wide *cumulative* standing
// (see lib/bcp.ts's fetchItcRanking), not a per-event breakdown, so
// there's nothing to put on a per-event trend line without computing a
// new number ourselves — which this app has consistently avoided doing
// (see internal/api/stats.go's StatsHandler doc comment on why win/loss
// reconstruction was declined the same way).
type Metric = "placing" | "percentile";

const CHART_WIDTH = 480;
const CHART_HEIGHT = 160;
const PAD_LEFT = 34;
const PAD_RIGHT = 16;
const PAD_TOP = 20;
const PAD_BOTTOM = 12;

function ordinal(n: number): string {
  const rounded = Math.round(n);
  const mod100 = rounded % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rounded}th`;
  switch (rounded % 10) {
    case 1:
      return `${rounded}st`;
    case 2:
      return `${rounded}nd`;
    case 3:
      return `${rounded}rd`;
    default:
      return `${rounded}th`;
  }
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** "Top X%" — undefined when the event never published a field size. */
function percentileOf(p: PlacingHistoryPoint): number | undefined {
  if (!p.fieldSize) return undefined;
  return Math.max(1, (p.placing / p.fieldSize) * 100);
}

function valueFor(p: PlacingHistoryPoint, metric: Metric): number | undefined {
  return metric === "placing" ? p.placing : percentileOf(p);
}

/** A direct label/tooltip headline value — "1st" or "top 4%". */
function formatValue(v: number, metric: Metric): string {
  return metric === "placing" ? ordinal(v) : `top ${Math.round(v)}%`;
}

/** An axis tick value — plain, since these are rounded reference points, not real results. */
function formatTick(v: number, metric: Metric): string {
  return metric === "placing" ? String(Math.round(v)) : `${Math.round(v)}%`;
}

/**
 * "My round"-style trend line: the signed-in (or viewed) player's placing
 * — or, toggled, percentile (placing ÷ that event's own published field
 * size) — across every already-concluded event with a known date, oldest
 * to newest. `points` (the event's own battle-points/format score) is
 * deliberately never plotted — see the Metric comment above — it only
 * ever shows up in the tooltip and the table view below the chart.
 *
 * Plotted by event *index*, not by actual date spacing — an evenly-spaced
 * line reads more clearly than one dominated by whatever gap happens to
 * be largest, and the story here is "better or worse over your last N
 * events," not literal elapsed time.
 *
 * Y-axis is inverted (a better result plots at the top: 1st place, or a
 * smaller "top X%") and scaled to this player's own best/worst for
 * whichever metric is selected, so the line always uses the full
 * vertical space. Percentile mode breaks the line wherever an event
 * never published a field size, rather than guessing — see linePath.
 */
export default function PlacingTrendChart({ points }: PlacingTrendChartProps) {
  const [metric, setMetric] = React.useState<Metric>("placing");
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const [tableExpanded, setTableExpanded] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);

  if (points.length < 2) return null;

  const hasAnyFieldSize = points.some((p) => p.fieldSize !== undefined);
  const activeMetric: Metric = metric === "percentile" && !hasAnyFieldSize ? "placing" : metric;

  const values = points.map((p) => valueFor(p, activeMetric));
  const definedValues = values.filter((v): v is number => v !== undefined);
  const minV = Math.min(...definedValues);
  const maxV = Math.max(...definedValues);
  // A little vertical breathing room so the best/worst points aren't
  // drawn flush against the chart edge; falls back to a fixed pad when
  // every result is identical, so the scale never collapses to zero
  // height.
  const pad = Math.max(activeMetric === "placing" ? 1 : 2, (maxV - minV) * 0.1);
  // Placing can't go below 1st; percentile can't go below 0%.
  const domainMin = Math.max(activeMetric === "placing" ? 1 : 0, minV - pad);
  const domainMax = maxV + pad;

  const plotWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xAt = (i: number) =>
    points.length === 1 ? PAD_LEFT : PAD_LEFT + (i / (points.length - 1)) * plotWidth;
  // Inverted: a better (lower) value maps to a smaller y (higher on screen).
  const yAt = (v: number) => PAD_TOP + ((v - domainMin) / (domainMax - domainMin || 1)) * plotHeight;

  // Multiple sub-paths, breaking wherever this event has no value for the
  // active metric (only possible in percentile mode) — a gap, not an
  // interpolated guess.
  let linePath = "";
  let segmentOpen = false;
  values.forEach((v, i) => {
    if (v === undefined) {
      segmentOpen = false;
      return;
    }
    linePath += `${segmentOpen ? "L" : "M"}${xAt(i)},${yAt(v)} `;
    segmentOpen = true;
  });

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const fraction = (relX - PAD_LEFT) / plotWidth;
    const nearest = Math.round(fraction * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, nearest)));
  };

  const latestIndex = points.length - 1;
  const latest = points[latestIndex];
  const latestValue = values[latestIndex];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredValue = hoverIndex !== null ? values[hoverIndex] : undefined;

  return (
    <div className="mt-3 border-t border-surface-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Placing over time</h3>
          <p className="text-xs text-text-tertiary">
            {activeMetric === "placing" ? "Placing" : "Percentile"} · lower is better
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Chart metric"
          className="flex gap-1 rounded-md border border-surface-border bg-surface-2 p-1"
        >
          {(["placing", "percentile"] as const).map((m) => {
            const active = activeMetric === m;
            const disabled = m === "percentile" && !hasAnyFieldSize;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                title={disabled ? "No event here has a published field size" : undefined}
                onClick={() => setMetric(m)}
                className={`rounded-sm px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "bg-brass-500 text-[oklch(0.16_0.006_260)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m === "placing" ? "Placing" : "Percentile"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`${activeMetric === "placing" ? "Placing" : "Percentile"} across ${points.length} events, from ${
            values[0] !== undefined ? formatValue(values[0], activeMetric) : "an event with no published field size"
          } at ${points[0].eventName} to ${
            latestValue !== undefined ? formatValue(latestValue, activeMetric) : "an event with no published field size"
          } at ${latest.eventName}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {/* Recessive gridlines at the domain's min/mid/max, each with a
              tick label — the values not directly labeled on the line
              itself still need to be readable somewhere. */}
          {[domainMax, (domainMin + domainMax) / 2, domainMin].map((g, i) => (
            <g key={i}>
              <line
                x1={PAD_LEFT}
                x2={CHART_WIDTH - PAD_RIGHT}
                y1={yAt(g)}
                y2={yAt(g)}
                className="stroke-surface-2"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 6}
                y={yAt(g)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-text-tertiary"
                fontSize={9}
              >
                {formatTick(g, activeMetric)}
              </text>
            </g>
          ))}

          <path
            d={linePath}
            fill="none"
            className="stroke-brass-500"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Crosshair — snaps to the nearest event on hover. */}
          {hoverIndex !== null && (
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={PAD_TOP}
              y2={CHART_HEIGHT - PAD_BOTTOM}
              className="stroke-text-tertiary"
              strokeWidth={1}
            />
          )}

          {points.map((p, i) => {
            const v = values[i];
            if (v === undefined) return null;
            const isEndpoint = i === latestIndex;
            const isHovered = i === hoverIndex;
            return (
              <g key={p.eventId + i}>
                {/* Oversized transparent hit target — ≥24px in screen
                    space, comfortably bigger than the visible mark. */}
                <circle cx={xAt(i)} cy={yAt(v)} r={12} fill="transparent" />
                {(isEndpoint || isHovered) && (
                  <circle cx={xAt(i)} cy={yAt(v)} r={4} className="fill-brass-500 stroke-surface-0" strokeWidth={2} />
                )}
              </g>
            );
          })}
        </svg>

        {/* Direct label: only the most recent result, to avoid a number
            on every point — the tooltip and table carry the rest. Skipped
            entirely if the latest event has no value for this metric. */}
        {latestValue !== undefined && (
          <span
            className="pointer-events-none absolute text-xs font-medium text-text-primary"
            style={{
              left: `${(xAt(latestIndex) / CHART_WIDTH) * 100}%`,
              top: `${(yAt(latestValue) / CHART_HEIGHT) * 100}%`,
              transform: "translate(-100%, -140%)",
            }}
          >
            {formatValue(latestValue, activeMetric)}
          </span>
        )}

        {hovered && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute z-10 max-w-[12rem] -translate-x-1/2 -translate-y-full rounded-md border border-surface-border bg-surface-1 px-2 py-1.5 text-xs shadow-md"
            style={{
              left: `${(xAt(hoverIndex) / CHART_WIDTH) * 100}%`,
              top: `${(yAt(hoveredValue ?? domainMin) / CHART_HEIGHT) * 100}%`,
            }}
          >
            <p className="font-semibold text-text-primary">
              {hoveredValue !== undefined ? formatValue(hoveredValue, activeMetric) : "No field size published"}
            </p>
            {activeMetric === "placing" && hovered.fieldSize && (
              <p className="text-text-tertiary">
                top {Math.round(percentileOf(hovered)!)}% of {hovered.fieldSize}
              </p>
            )}
            {activeMetric === "percentile" && (
              <p className="text-text-tertiary">
                {ordinal(hovered.placing)}
                {hovered.fieldSize ? ` of ${hovered.fieldSize}` : ""}
              </p>
            )}
            <p className="truncate text-text-secondary">{hovered.eventName}</p>
            <p className="text-text-tertiary">
              {formatShortDate(hovered.eventDate)}
              {hovered.points !== undefined && ` · ${hovered.points} pts`}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setTableExpanded((v) => !v)}
        aria-expanded={tableExpanded}
        className="mt-1 text-xs text-text-secondary hover:underline"
      >
        {tableExpanded ? "Hide" : "Show"} as a table
      </button>

      {tableExpanded && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-surface-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface-1 text-text-tertiary">
              <tr>
                <th className="px-2 py-1 font-medium">Event</th>
                <th className="px-2 py-1 font-medium">Date</th>
                <th className="px-2 py-1 font-medium">Placing</th>
                <th className="px-2 py-1 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={p.eventId + i} className="border-t border-surface-border">
                  <td className="px-2 py-1 text-text-primary">{p.eventName}</td>
                  <td className="px-2 py-1 text-text-secondary">{formatShortDate(p.eventDate)}</td>
                  <td className="px-2 py-1 text-text-secondary">
                    {ordinal(p.placing)}
                    {p.fieldSize ? ` of ${p.fieldSize}` : ""}
                  </td>
                  <td className="px-2 py-1 text-text-secondary">{p.points ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
