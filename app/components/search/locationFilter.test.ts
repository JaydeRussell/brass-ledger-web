import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import LocationFilter from "./locationFilter.tsx";

const noop = () => {};

test("Anywhere shows no radius and no privacy note", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocationFilter, { location: null, onLocationChange: noop, radiusMiles: 50, onRadiusChange: noop })
  );
  assert.match(html, /aria-checked="true"[^>]*>Anywhere/);
  assert.doesNotMatch(html, /Within/);
  assert.doesNotMatch(html, /OpenStreetMap/);
});

test("a place shows its name, other matches, the radius, the privacy note and OSM credit", () => {
  const html = renderToStaticMarkup(
    React.createElement(LocationFilter, {
      location: {
        kind: "place",
        name: "Denver, Colorado, United States",
        lat: 39.74,
        lon: -104.99,
        others: [{ name: "Denver, Iowa, United States", lat: 42.67, lon: -92.34 }],
      },
      onLocationChange: noop,
      radiusMiles: 100,
      onRadiusChange: noop,
    })
  );
  assert.match(html, /Near <span[^>]*>Denver, Colorado, United States/);
  assert.match(html, /Denver, Iowa, United States/);
  assert.match(html, /<option value="100" selected="">100 miles \(161 km\)/);
  assert.match(html, /sent to Best Coast Pairings/);
  assert.match(html, /openstreetmap\.org\/copyright/);
});
