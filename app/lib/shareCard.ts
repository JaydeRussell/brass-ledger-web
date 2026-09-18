// A downloadable share-card image for a public dossier (see dossier.ts)
// — an alternative to shareDossierButton.tsx's existing plain-text
// clipboard copy, for somewhere the "name — headline. url" text doesn't
// travel well (an Instagram/Discord image post, say). Deliberately
// rendered entirely client-side with the native Canvas API (no
// server-side next/og image route): shareDossierButton.tsx's own doc
// comment already explains why — this app's Next.js server has never
// called brass-ledger-api directly (every request goes straight from
// the browser), and standing that up just for this is a deploy-config
// decision left as its own follow-up, not something to introduce
// silently here. Everything this needs (the dossier itself) is already
// fetched client-side by the time the Share button is clickable.

import type { Dossier } from "./dossier";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

/** The text content of the card, split out as a pure function so it's
 * testable without a canvas/DOM — same reasoning as buildShareText in
 * shareDossierButton.tsx. */
export function buildShareCardText(dossier: Dossier): {
  headline: string;
  subline: string;
  factionLines: string[];
} {
  const eventCount = `${dossier.totalEvents} event${dossier.totalEvents === 1 ? "" : "s"}`;
  const headline = dossier.bestPlacing
    ? ordinalPlacing(dossier.bestPlacing.placing) + "-place best finish"
    : "No concluded events yet";
  const subline = dossier.bestPlacing ? `across ${eventCount}` : `${eventCount} played`;
  const factionLines = dossier.factions
    .slice(0, 3)
    .map((f) => `${f.faction} — ${f.eventCount} event${f.eventCount === 1 ? "" : "s"}`);
  return { headline, subline, factionLines };
}

/** 1st/2nd/3rd/4th… — duplicated from playerStatsPanel.tsx's own
 * `ordinal` rather than imported: that one is exported for its own
 * page's tests, not meant as a shared utility, and this is a one-line
 * rule not worth threading a new shared module for. */
function ordinalPlacing(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Draws the card onto a fresh off-screen canvas at CARD_WIDTH×CARD_HEIGHT
 * and returns it. Reads this app's own accent-theme CSS custom
 * properties (--brass-500 etc.) straight off <html> via getComputedStyle
 * — Canvas 2D's fillStyle accepts an oklch() string directly (CSS Color
 * 4), so the card automatically matches whichever accent theme this
 * visitor has picked (see lib/theme.ts) rather than a hardcoded color.
 * Never unit-tested (no DOM in this project's test setup — see
 * app/lib/testUtils.ts) — verified live instead; buildShareCardText
 * above carries the one piece of this worth testing without a canvas.
 */
export function renderShareCardCanvas(dossier: Dossier): HTMLCanvasElement {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;

  const surface0 = token("--surface-0", "#141416");
  const surface1 = token("--surface-1", "#1c1c1f");
  const brass500 = token("--brass-500", "#c99a4d");
  const brass400 = token("--brass-400", "#d9b877");
  const textPrimary = token("--text-primary", "#f0f0f0");
  const textSecondary = token("--text-secondary", "#b8b8b8");
  const border = token("--surface-border", "#3a3a3f");

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Background + a thin brass top rule (this app's own "riveted plate"
  // visual language, dialed down to one accent line rather than a full
  // texture — a card viewed at a glance in a chat thread doesn't need
  // the detail globals.css's own doc comment describes for on-screen UI).
  ctx.fillStyle = surface0;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = brass500;
  ctx.fillRect(0, 0, CARD_WIDTH, 8);

  ctx.fillStyle = surface1;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  const panelX = 64;
  const panelY = 64;
  const panelW = CARD_WIDTH - 128;
  const panelH = CARD_HEIGHT - 128;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

  const { headline, subline, factionLines } = buildShareCardText(dossier);

  ctx.fillStyle = brass400;
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText("BRASS LEDGER", panelX + 48, panelY + 68);

  ctx.fillStyle = textPrimary;
  ctx.font = "700 56px system-ui, sans-serif";
  ctx.fillText(dossier.name, panelX + 48, panelY + 148);

  ctx.fillStyle = brass400;
  ctx.font = "600 40px system-ui, sans-serif";
  ctx.fillText(headline, panelX + 48, panelY + 210);
  ctx.fillStyle = textSecondary;
  ctx.font = "400 28px system-ui, sans-serif";
  ctx.fillText(subline, panelX + 48, panelY + 248);

  ctx.fillStyle = textSecondary;
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillText("TOP FACTIONS", panelX + 48, panelY + 320);
  ctx.font = "400 26px system-ui, sans-serif";
  ctx.fillStyle = textPrimary;
  factionLines.forEach((line, i) => {
    ctx.fillText(line, panelX + 48, panelY + 358 + i * 36);
  });

  return canvas;
}

/** Renders the card and triggers a browser download of it as a PNG —
 * the same "no server round-trip" posture as renderShareCardCanvas
 * above. `canvas.toBlob` + a synthetic <a download> click is the
 * standard vanilla approach; no library needed. */
export function downloadShareCardImage(dossier: Dossier, filename: string): void {
  const canvas = renderShareCardCanvas(dossier);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
