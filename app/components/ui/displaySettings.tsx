"use client";
import { DENSITIES, TEXT_SIZES, useDisplayPrefs } from "../../lib/displayPrefs";
import { radioGroupKeyDown } from "../../lib/radioGroup";

/**
 * Text size (four steps, each shown at its own size), Density and a
 * Higher contrast switch, for the nav drawer's Display section.
 */
export default function DisplaySettings() {
  const { textSize, setTextSize, density, setDensity, highContrast, setHighContrast } = useDisplayPrefs();

  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex items-center justify-between gap-3">
        <span id="text-size-label" className="text-xs text-text-secondary">
          Text size
        </span>
        <div role="radiogroup" aria-labelledby="text-size-label" className="flex gap-1" onKeyDown={(e) => radioGroupKeyDown(e)}>
          {TEXT_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              role="radio"
              aria-checked={textSize === size.value}
              aria-label={size.label}
              title={size.label}
              tabIndex={textSize === size.value ? 0 : -1}
              onClick={() => setTextSize(size.value)}
              className={`flex h-7 w-7 items-center justify-center rounded-md border font-medium leading-none ${
                textSize === size.value
                  ? "border-brass-500 bg-brass-500/15 text-brass-400"
                  : "border-surface-border text-text-secondary hover:bg-surface-2"
              }`}
              // Each button's "A" is drawn at its own step so the choice
              // previews itself; fixed in px so the buttons don't resize
              // as the setting changes.
              style={{ fontSize: `${Math.round(12 * size.scale)}px` }}
            >
              A
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span id="density-label" className="text-xs text-text-secondary">
          Density
        </span>
        <div
          role="radiogroup"
          aria-labelledby="density-label"
          onKeyDown={(e) => radioGroupKeyDown(e)}
          className="flex overflow-hidden rounded-md border border-surface-border"
        >
          {DENSITIES.map((d) => (
            <button
              key={d.value}
              type="button"
              role="radio"
              aria-checked={density === d.value}
              tabIndex={density === d.value ? 0 : -1}
              onClick={() => setDensity(d.value)}
              className={`px-2 py-1 text-2xs font-medium ${
                density === d.value
                  ? "bg-brass-500/15 text-brass-400"
                  : "text-text-secondary hover:bg-surface-2"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-secondary">Higher contrast</span>
        <button
          type="button"
          role="switch"
          aria-checked={highContrast}
          aria-label="Higher contrast"
          onClick={() => setHighContrast(!highContrast)}
          className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors before:absolute before:-inset-x-1 before:-inset-y-2 before:content-[''] ${
            highContrast ? "border-brass-500 bg-brass-500" : "border-surface-border bg-surface-2"
          }`}
        >
          <span
            aria-hidden
            className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-surface-0 transition-transform ${
              highContrast ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
