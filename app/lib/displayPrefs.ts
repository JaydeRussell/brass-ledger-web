// In-app text size and higher-contrast preferences. Same shape as
// lib/motionPrefs.ts: a data-* attribute on <html>, kept in localStorage
// per device (the size you want on a phone isn't the one you want on a
// laptop) and applied by an inline <head> script before first paint.
//
// Text size scales on top of the device's own text size, which the page
// follows separately (globals.css and layout.tsx's text-scale meta).

import { useEffect, useState } from "react";

export type TextSize = "sm" | "md" | "lg" | "xl";

export const TEXT_SIZES: { value: TextSize; label: string; scale: number }[] = [
  { value: "sm", label: "Small", scale: 0.9 },
  { value: "md", label: "Default", scale: 1 },
  { value: "lg", label: "Large", scale: 1.15 },
  { value: "xl", label: "Larger", scale: 1.3 },
];

const TEXT_SIZE_KEY = "textSize";
const CONTRAST_KEY = "highContrast";

export function isTextSize(value: string | null): value is TextSize {
  return TEXT_SIZES.some((s) => s.value === value);
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // best-effort only (e.g. private browsing can throw)
  }
}

/** "md" removes the attribute so globals.css has one default path. */
export function applyTextSize(size: TextSize) {
  if (typeof document === "undefined") return;
  if (size === "md") document.documentElement.removeAttribute("data-text-size");
  else document.documentElement.setAttribute("data-text-size", size);
  write(TEXT_SIZE_KEY, size);
}

export function applyHighContrast(on: boolean) {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.setAttribute("data-contrast", "more");
  else document.documentElement.removeAttribute("data-contrast");
  write(CONTRAST_KEY, on ? "1" : "0");
}

/** Run synchronously in <head> (see layout.tsx, which keeps its own copy:
 * a Server Component can't import this hook module). */
export const DISPLAY_PREFS_INIT_SCRIPT = `(function(){try{var d=document.documentElement,s=localStorage.getItem("${TEXT_SIZE_KEY}");if(s==="sm"||s==="lg"||s==="xl")d.setAttribute("data-text-size",s);if(localStorage.getItem("${CONTRAST_KEY}")==="1")d.setAttribute("data-contrast","more");}catch(e){}})();`;

/** Current preferences plus setters that apply them immediately. Start at
 * the defaults (what a server render sees) and sync to the stored values
 * right after mount. */
export function useDisplayPrefs(): {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  setHighContrast: (on: boolean) => void;
} {
  const [textSize, setTextSizeState] = useState<TextSize>("md");
  const [highContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      const stored = read(TEXT_SIZE_KEY);
      setTextSizeState(isTextSize(stored) ? stored : "md");
      setHighContrastState(read(CONTRAST_KEY) === "1");
    });
  }, []);

  return {
    textSize,
    setTextSize: (size) => {
      setTextSizeState(size);
      applyTextSize(size);
    },
    highContrast,
    setHighContrast: (on) => {
      setHighContrastState(on);
      applyHighContrast(on);
    },
  };
}
