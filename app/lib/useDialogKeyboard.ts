"use client";
import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard behaviour for the app's hand-rolled modal panels (kept in place
 * rather than portalled so they stay testable with react-dom/server):
 * Escape closes, and Tab / Shift+Tab cycle through every control in the
 * panel instead of leaving it for the page behind the backdrop. Attach the returned ref to
 * the element with role="dialog".
 */
export function useDialogKeyboard<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const panel = ref.current;
      if (!panel) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      // Moved by hand every time rather than only at the ends: Safari's
      // default Tab skips buttons and links, so from a text field it
      // would jump straight out of the panel.
      e.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next =
        index === -1 ? 0 : (index + (e.shiftKey ? -1 : 1) + items.length) % items.length;
      items[next].focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return ref;
}
