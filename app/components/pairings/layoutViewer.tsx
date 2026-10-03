"use client";
import React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

export type LayoutImage = { layout: string; src: string };

type LayoutViewerProps = {
  layouts: LayoutImage[];
  // The layout currently shown, or null when closed.
  open: string | null;
  onSelect: (layout: string) => void;
  onClose: () => void;
};

/**
 * Full-screen view of one deployment layout, with a close button and
 * arrows to step between the layouts. Escape and a tap outside the image
 * also close it. Opening and closing go through the URL (see
 * useLayoutParam), so the device's back button closes it rather than
 * leaving the page.
 */
export default function LayoutViewer({ layouts, open, onSelect, onClose }: LayoutViewerProps) {
  const index = layouts.findIndex((l) => l.layout === open);
  const current = index >= 0 ? layouts[index] : undefined;
  const step = (delta: number) => {
    if (index < 0) return;
    const next = layouts[(index + delta + layouts.length) % layouts.length];
    onSelect(next.layout);
  };

  return (
    <RadixDialog.Root open={current !== undefined} onOpenChange={(o) => !o && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
        <RadixDialog.Content
          className="fixed inset-0 z-50 flex flex-col outline-none"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
          }}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between gap-2 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2">
            <RadixDialog.Title className="text-sm font-semibold text-white">
              Layout {current?.layout}
            </RadixDialog.Title>
            <RadixDialog.Close
              className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60"
              aria-label="Close layout"
            >
              Close ✕
            </RadixDialog.Close>
          </div>
          {/* A tap on the empty area around the image closes the viewer. */}
          <div
            className="flex min-h-0 flex-1 items-center justify-center px-2"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            {current && (
              // eslint-disable-next-line @next/next/no-img-element -- a pre-cropped local static asset
              <img
                src={current.src}
                alt={`Layout ${current.layout} for this deployment`}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
          {layouts.length > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous layout"
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
              >
                ‹
              </button>
              {layouts.map((l) => (
                <button
                  key={l.layout}
                  type="button"
                  onClick={() => onSelect(l.layout)}
                  aria-current={l.layout === current?.layout}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    l.layout === current?.layout
                      ? "border-brass-500/60 bg-brass-500/25 text-white"
                      : "border-white/20 bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {l.layout}
                </button>
              ))}
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next layout"
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
              >
                ›
              </button>
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

const LAYOUT_PARAM = "layout";
// Fired after this module changes the URL itself; pushState/replaceState
// don't emit popstate.
const LAYOUT_CHANGE_EVENT = "layoutparamchange";

function urlWith(layout: string | null): string {
  const url = new URL(window.location.href);
  if (layout) url.searchParams.set(LAYOUT_PARAM, layout);
  else url.searchParams.delete(LAYOUT_PARAM);
  return url.pathname + url.search + url.hash;
}

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(LAYOUT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(LAYOUT_CHANGE_EVENT, onChange);
  };
}

const readLayout = () => new URLSearchParams(window.location.search).get(LAYOUT_PARAM);

function setUrl(method: "pushState" | "replaceState", layout: string | null) {
  window.history[method](null, "", urlWith(layout));
  window.dispatchEvent(new Event(LAYOUT_CHANGE_EVENT));
}

/**
 * Keeps the open layout in the URL's `layout` param. Opening adds a
 * history entry so back closes the viewer; switching layouts replaces it.
 * Closing steps back when this page added the entry, and otherwise (a
 * link opened straight to a layout) just removes the param.
 */
export function useLayoutParam(): {
  open: string | null;
  openLayout: (layout: string) => void;
  selectLayout: (layout: string) => void;
  close: () => void;
} {
  const open = React.useSyncExternalStore(subscribe, readLayout, () => null);
  const pushedRef = React.useRef(false);
  // Once closed by any route (including the back button), the entry this
  // page pushed is gone.
  React.useEffect(() => {
    if (open === null) pushedRef.current = false;
  }, [open]);

  return {
    open,
    openLayout: (layout) => {
      pushedRef.current = true;
      setUrl("pushState", layout);
    },
    selectLayout: (layout) => setUrl("replaceState", layout),
    close: () => {
      if (pushedRef.current) {
        pushedRef.current = false;
        window.history.back();
      } else {
        setUrl("replaceState", null);
      }
    },
  };
}
