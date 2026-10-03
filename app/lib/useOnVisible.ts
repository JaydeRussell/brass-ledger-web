"use client";
import React from "react";

/**
 * Calls `onVisible` once, after the returned ref's element has stayed in
 * (or near) the viewport for `dwellMs`. Scrolling quickly past an element
 * never fires it. Does nothing where IntersectionObserver is unavailable.
 */
export function useOnVisible<T extends Element>(
  onVisible: (() => void) | undefined,
  dwellMs = 300
): React.RefObject<T | null> {
  const ref = React.useRef<T | null>(null);
  const callbackRef = React.useRef(onVisible);
  React.useEffect(() => {
    callbackRef.current = onVisible;
  }, [onVisible]);

  const enabled = onVisible !== undefined;
  React.useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          timer ??= setTimeout(() => {
            observer.disconnect();
            callbackRef.current?.();
          }, dwellMs);
        } else if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      { rootMargin: "100px 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [enabled, dwellMs]);

  return ref;
}
