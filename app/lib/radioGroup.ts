import type { KeyboardEvent } from "react";

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * Arrow, Home and End keys for a group of role="radio" buttons, as screen
 * readers announce them: focus moves to the next enabled radio and, unless
 * `select` is false, chooses it. Pair with tabIndex 0 on the checked radio
 * and -1 on the rest, so the group is a single Tab stop.
 */
export function radioGroupKeyDown(e: KeyboardEvent<HTMLElement>, { select = true }: { select?: boolean } = {}) {
  if (!(e.key in STEP) && e.key !== "Home" && e.key !== "End") return;
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'));
  const current = radios.indexOf(document.activeElement as HTMLButtonElement);
  if (radios.length === 0 || current < 0) return;
  e.preventDefault();
  const next =
    e.key === "Home" ? 0 : e.key === "End" ? radios.length - 1 : (current + STEP[e.key] + radios.length) % radios.length;
  radios[next].focus();
  if (select) radios[next].click();
}
