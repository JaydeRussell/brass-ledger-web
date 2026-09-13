#!/usr/bin/env bash
# One-off content-generation script — NOT part of npm test/build/dev, same
# status as scripts/tsx-test-loader.mjs being referenced only from
# package.json's own `test` entry. Run manually, once, whenever the source
# PDF changes (see app/lib/missionSources.ts's `eventCompanion` entry for
# the version this was last run against).
#
# Crops the 45 deployment-map diagrams out of the official "Warhammer Event
# Companion" PDF (pages 9-53) into public/deployment-maps/, one PNG per
# disposition-pairing x layout-letter.
#
# Page order (confirmed via `pdftotext -layout`, not guessed — each of the
# 15 disposition pairings occupies exactly 3 consecutive pages, layouts
# A/B/C in that order, starting at page 9):
#   9-11   Take and Hold      vs Take and Hold
#   12-14  Take and Hold      vs Purge the Foe
#   15-17  Take and Hold      vs Disruption
#   18-20  Take and Hold      vs Reconnaissance
#   21-23  Take and Hold      vs Priority Assets
#   24-26  Purge the Foe      vs Purge the Foe
#   27-29  Purge the Foe      vs Disruption
#   30-32  Purge the Foe      vs Reconnaissance
#   33-35  Purge the Foe      vs Priority Assets
#   36-38  Disruption         vs Disruption
#   39-41  Disruption         vs Reconnaissance
#   42-44  Disruption         vs Priority Assets
#   45-47  Reconnaissance     vs Reconnaissance
#   48-50  Reconnaissance     vs Priority Assets
#   51-53  Priority Assets    vs Priority Assets
#
# The crop rectangle (in pixels, at 200dpi) was found by rendering a sample
# page full-size, inspecting it, and iterating until the box tightly framed
# "LAYOUT X" through the bottom Attacker/Defender bar on both page 9 (first
# pairing) and page 53 (last pairing) — confirmed identical since every
# page uses the same template.
#
# Output is WebP, not PNG: pdftoppm's raw PNG crop is ~1MB/image (67MB for
# all 45) because of the diagrams' grainy paper-texture background: cwebp
# -q 82 at native crop resolution brings that down to ~60-90KB/image
# (~3MB total) with no visible loss of legibility on the fine measurement
# labels — confirmed visually before committing to this, not assumed.
# Requires `cwebp` (already present on this machine via Homebrew).

set -euo pipefail

SRC_PDF="${1:-$HOME/Downloads/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf}"
OUT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/deployment-maps"

DPI=200
CROP_X=339
CROP_Y=615
CROP_W=983
CROP_H=1560

if [ ! -f "$SRC_PDF" ]; then
  echo "Source PDF not found: $SRC_PDF" >&2
  exit 1
fi

# "<dispositionA>:<dispositionB>" pairs, in the fixed page order above.
# Directory names use each pairing's two slugs sorted alphabetically (see
# app/lib/dispositions.ts's dispositionSlug / app/lib/missionMatchups.ts's
# deploymentMapPaths), computed inline here so this script has no runtime
# dependency on the TypeScript source.
PAIRINGS=(
  "take-and-hold:take-and-hold"
  "take-and-hold:purge-the-foe"
  "take-and-hold:disruption"
  "take-and-hold:reconnaissance"
  "take-and-hold:priority-assets"
  "purge-the-foe:purge-the-foe"
  "purge-the-foe:disruption"
  "purge-the-foe:reconnaissance"
  "purge-the-foe:priority-assets"
  "disruption:disruption"
  "disruption:reconnaissance"
  "disruption:priority-assets"
  "reconnaissance:reconnaissance"
  "reconnaissance:priority-assets"
  "priority-assets:priority-assets"
)

page=9
for pairing in "${PAIRINGS[@]}"; do
  a="${pairing%%:*}"
  b="${pairing##*:}"
  # Sort the two slugs alphabetically for an order-independent directory name.
  if [[ "$a" < "$b" || "$a" == "$b" ]]; then
    dir="${a}-vs-${b}"
  else
    dir="${b}-vs-${a}"
  fi

  mkdir -p "$OUT_ROOT/$dir"

  for letter in a b c; do
    echo "page $page -> deployment-maps/$dir/$letter.webp"
    tmpdir="$(mktemp -d)"
    tmp_prefix="$tmpdir/layout"
    pdftoppm -png -r "$DPI" -x "$CROP_X" -y "$CROP_Y" -W "$CROP_W" -H "$CROP_H" \
      -f "$page" -l "$page" "$SRC_PDF" "$tmp_prefix"
    # pdftoppm zero-pads the page number in its output filename.
    produced=$(printf "%s-%02d.png" "$tmp_prefix" "$page")
    cwebp -quiet -q 82 "$produced" -o "$OUT_ROOT/$dir/$letter.webp"
    rm -rf "$tmpdir"
    page=$((page + 1))
  done
done

echo "Done: $((page - 9)) pages cropped into $OUT_ROOT"
