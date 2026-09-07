/* eslint-disable @typescript-eslint/no-explicit-any -- this file's whole
 * job is inspecting arbitrary components' props (button onClick handlers,
 * input values, and so on) without knowing their prop types in advance;
 * that's what React.ReactElement<any> below buys back (`.props` typed as
 * `any` instead of `unknown`) for every test file that uses these
 * helpers, without each of them needing its own cast. */

// Small hand-rolled component-testing helpers, written because this
// sandboxed environment has no network access to install jsdom/
// @testing-library/react (see CLAUDE.md's "Component testing" note).
//
// Two techniques, picked per component depending on whether it uses hooks:
//
// 1. `renderStatic` (wraps react-dom/server's renderToStaticMarkup, which
//    is already a dependency of react-dom and needs no DOM) — for any
//    component, gives back real rendered HTML. Good for asserting on text,
//    classes, and attributes across different prop/initial-state
//    combinations. Can't simulate clicks/typing (no DOM to dispatch events
//    into) and doesn't run effects (SSR never does).
//
// 2. `walk`/`find`/`findAll` — for a *hookless* component, call it directly
//    as a plain function (React function components are just functions;
//    JSX/createElement calls on its children build element descriptors
//    without invoking them) and walk the returned element tree to find a
//    button/input/etc. by its props, then invoke its onClick/onChange
//    directly. This gives genuine interaction coverage (does the right
//    callback fire with the right argument?) without a DOM, but only works
//    for components that don't call hooks themselves (a component that
//    calls useState/useContext/etc. needs React's own render loop to
//    supply the hooks dispatcher — use renderStatic for those instead).
//
// If jsdom + @testing-library/react become installable later (this
// project's own devDependencies don't have network access to npm in the
// sandboxed environments this is developed through — see CLAUDE.md), the
// tests built on these helpers can be upgraded to real user-event
// simulation; the assertions they make (rendered text/attributes, correct
// callback arguments) should carry over largely unchanged.

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** Renders a component to an HTML string via React's real SSR path (so
 * useState/useContext work; effects do not run, same as any SSR pass). */
export function renderStatic(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

/** Recursively visits every React element in a tree of element
 * descriptors (as returned by calling a hookless function component
 * directly, or by JSX), including elements nested inside `props.children`. */
export function walk(node: React.ReactNode, visit: (el: React.ReactElement<any>) => void): void {
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  if (!React.isValidElement(node)) return;
  visit(node);
  const children = (node.props as { children?: React.ReactNode })?.children;
  if (children !== undefined) walk(children, visit);
}

export function findAll(
  node: React.ReactNode,
  predicate: (el: React.ReactElement<any>) => boolean
): React.ReactElement<any>[] {
  const found: React.ReactElement<any>[] = [];
  walk(node, (el) => {
    if (predicate(el)) found.push(el);
  });
  return found;
}

export function find(
  node: React.ReactNode,
  predicate: (el: React.ReactElement<any>) => boolean
): React.ReactElement<any> | undefined {
  return findAll(node, predicate)[0];
}

/** Matches an element by tag/component type and (optionally) a substring
 * of its text-ish content (aria-label, title, or a plain-string child). */
export function byText(node: React.ReactNode, text: string): React.ReactElement<any> | undefined {
  return find(node, (el) => {
    const props = el.props as { children?: React.ReactNode; "aria-label"?: string; title?: string };
    if (props["aria-label"]?.includes(text)) return true;
    if (props.title?.includes(text)) return true;
    if (typeof props.children === "string" && props.children.includes(text)) return true;
    if (Array.isArray(props.children)) {
      return props.children.some((c) => typeof c === "string" && c.includes(text));
    }
    return false;
  });
}
