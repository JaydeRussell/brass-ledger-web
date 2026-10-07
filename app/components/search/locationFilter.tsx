"use client";
import React, { useId, useRef, useState } from "react";

import Button from "../ui/button";
import { coarsen, lookupPlace, SEARCH_RADII_MILES, type Place } from "../../lib/follow";

/** Where a search is centred: the device's rough location, or a looked-up place. */
export type SearchLocation =
  | { kind: "near"; lat: number; lon: number }
  | { kind: "place"; name: string; lat: number; lon: number; others: Place[] };

type LocationFilterProps = {
  location: SearchLocation | null;
  onLocationChange: (location: SearchLocation | null) => void;
  radiusMiles: number;
  onRadiusChange: (miles: number) => void;
};

type Mode = "anywhere" | "near" | "place";

const SEGMENT =
  "rounded-md px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60";

/**
 * Anywhere, near the device (rounded to about 10 km before it's sent), or
 * near a typed place (looked up on request through the backend, which
 * asks OpenStreetMap). Nothing here is stored.
 */
export default function LocationFilter({ location, onLocationChange, radiusMiles, onRadiusChange }: LocationFilterProps) {
  const placeId = useId();
  const radiusId = useId();
  const [mode, setMode] = useState<Mode>(location ? location.kind : "anywhere");
  const [placeDraft, setPlaceDraft] = useState(location?.kind === "place" ? location.name : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped by every mode change and lookup. A location that arrives for an
  // older one is dropped, so a slow answer can't set a location after the
  // person has switched to Anywhere.
  const request = useRef(0);

  const choose = (next: Mode) => {
    request.current += 1;
    setBusy(false);
    setMode(next);
    setError(null);
    if (next === "anywhere") onLocationChange(null);
    if (next === "near") requestDeviceLocation();
    if (next === "place" && location?.kind !== "place") onLocationChange(null);
  };

  const requestDeviceLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("This browser can't share its location. Type a place instead.");
      return;
    }
    const mine = ++request.current;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mine !== request.current) return;
        setBusy(false);
        onLocationChange({ kind: "near", lat: coarsen(pos.coords.latitude), lon: coarsen(pos.coords.longitude) });
      },
      (err) => {
        if (mine !== request.current) return;
        setBusy(false);
        onLocationChange(null);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access is turned off for this site. Allow it in your browser, or type a place instead."
            : "Couldn't get your location. Try again, or type a place instead."
        );
      },
      // Coarse is all a radius search needs, and it's quicker.
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 15_000 }
    );
  };

  const findPlace = async () => {
    if (placeDraft.trim().length < 2) return;
    const mine = ++request.current;
    setBusy(true);
    setError(null);
    try {
      const [first, ...others] = await lookupPlace(placeDraft);
      if (mine !== request.current) return;
      if (!first) {
        onLocationChange(null);
        setError("No place matches that. Try a city and country, like “Lindsay, Canada”.");
        return;
      }
      onLocationChange({ kind: "place", ...first, others });
    } catch (err) {
      if (mine === request.current) setError(err instanceof Error ? err.message : "Couldn't look that place up.");
    } finally {
      if (mine === request.current) setBusy(false);
    }
  };

  const pickOther = (index: number) => {
    if (location?.kind !== "place") return;
    const all = [{ name: location.name, lat: location.lat, lon: location.lon }, ...location.others];
    const chosen = all[index];
    onLocationChange({ kind: "place", ...chosen, others: all.filter((_, i) => i !== index) });
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="text-xs font-medium text-text-secondary">Location</legend>
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Location">
        {(
          [
            ["anywhere", "Anywhere"],
            ["near", "Near me"],
            ["place", "Near a place"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => choose(value)}
            className={`${SEGMENT} ${
              mode === value
                ? "bg-brass-500 text-[oklch(0.16_0.006_260)]"
                : "border border-surface-border bg-surface-1 text-text-secondary hover:bg-surface-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "place" && (
        <div className="flex gap-2">
          <label htmlFor={placeId} className="sr-only">
            Place
          </label>
          <input
            id={placeId}
            value={placeDraft}
            onChange={(e) => setPlaceDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void findPlace();
              }
            }}
            placeholder="City, region or postcode"
            className="min-w-0 flex-1 rounded-md border border-surface-border bg-surface-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brass-500 focus-visible:ring-2 focus-visible:ring-brass-500/40"
          />
          <Button type="button" variant="secondary" onClick={findPlace} disabled={busy || placeDraft.trim().length < 2}>
            Find
          </Button>
        </div>
      )}

      {busy && <p className="text-xs text-text-tertiary">{mode === "near" ? "Getting your location…" : "Looking it up…"}</p>}
      {error && <p className="text-xs text-danger-400">{error}</p>}

      {location?.kind === "near" && !busy && (
        <p className="text-xs text-text-secondary">Using your approximate location.</p>
      )}
      {location?.kind === "place" && !busy && (
        <div className="flex min-w-0 flex-col gap-1 text-xs text-text-secondary">
          <span className="min-w-0 break-words">
            Near <span className="text-text-primary">{location.name}</span>
          </span>
          {location.others.length > 0 && (
            <select
              aria-label="Not this place? Choose another match"
              value=""
              onChange={(e) => e.target.value !== "" && pickOther(Number(e.target.value) + 1)}
              className="min-h-[24px] w-full min-w-0 max-w-full truncate rounded-md border border-surface-border bg-surface-1 px-2 py-1 text-xs text-text-secondary"
            >
              <option value="">Not this one?</option>
              {location.others.map((p, i) => (
                <option key={`${p.name}-${i}`} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {mode !== "anywhere" && (
        <label htmlFor={radiusId} className="flex items-center gap-2 text-xs text-text-secondary">
          Within
          <select
            id={radiusId}
            value={radiusMiles}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="min-h-[24px] rounded-md border border-surface-border bg-surface-1 px-2 py-1.5 text-xs text-text-primary"
          >
            {SEARCH_RADII_MILES.map((m) => (
              <option key={m} value={m}>
                {m} miles ({Math.round(m * 1.609)} km)
              </option>
            ))}
          </select>
        </label>
      )}

      {mode !== "anywhere" && (
        <p className="text-xs text-text-tertiary">
          Your approximate location (to about 10 km), or the place you type, is sent to Best Coast Pairings to find
          nearby events, and a typed place is looked up with OpenStreetMap. Neither is stored. Place search ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text-secondary"
          >
            OpenStreetMap contributors
          </a>
          .
        </p>
      )}
    </fieldset>
  );
}
