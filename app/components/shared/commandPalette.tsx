"use client";
import React from "react";
import { useCommandPalette } from "./commandPaletteContext";
import { useLazyComponent } from "../../lib/useLazyComponent";

// Memoized so repeated opens share one promise.
let bodyModule: Promise<typeof import("./commandPaletteBody")> | null = null;
const loadBody = () => (bodyModule ??= import("./commandPaletteBody"));

/**
 * The always-mounted shell for the ⌘K command palette, mounted once in
 * app/layout.tsx. Owns two things only: the global keyboard shortcut,
 * and when the palette's actual contents (commandPaletteBody.tsx) get
 * loaded.
 *
 * The shortcut deliberately stays here rather than in the body — it has
 * to work on a page where nobody has opened the palette yet, which is
 * the whole point of the body being lazy.
 */
export default function CommandPalette() {
  const { isOpen, toggle } = useCommandPalette();
  const Body = useLazyComponent(loadBody, isOpen);

  // Added once, independent of isOpen, so ⌘K/Ctrl+K toggles from
  // anywhere. Doesn't fire while a modifier-less key is being typed into
  // a normal input (this always requires a modifier), so it can't
  // clobber a visitor's typing elsewhere.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  if (!isOpen || !Body) return null;
  // React.createElement rather than <Body />: the component comes from
  // state (see useLazyComponent), and the React Compiler's
  // static-components rule can't tell that from a component defined
  // during render, which it rightly rejects.
  return React.createElement(Body);
}
