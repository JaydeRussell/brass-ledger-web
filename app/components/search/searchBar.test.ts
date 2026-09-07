import { test } from "node:test";
import assert from "node:assert/strict";
import SearchBar from "./searchBar.tsx";
import { find } from "../../lib/testUtils.ts";

// SearchBar has no hooks of its own, so — same technique as tabBar.test.ts
// — it can be called directly as a plain function and its element tree
// walked to find and invoke real event handlers.

test("shows the given value and a default placeholder", () => {
  const tree = SearchBar({ value: "abc", onChange: () => {} });
  const input = find(tree, (el) => el.type === "input");
  assert.equal(input?.props.value, "abc");
  assert.equal(input?.props.placeholder, "Search…");
});

test("a custom placeholder overrides the default", () => {
  const tree = SearchBar({ value: "", onChange: () => {}, placeholder: "Find a player…" });
  const input = find(tree, (el) => el.type === "input");
  assert.equal(input?.props.placeholder, "Find a player…");
});

test("typing calls onChange with the new value", () => {
  const calls: string[] = [];
  const tree = SearchBar({ value: "", onChange: (v) => calls.push(v) });
  const input = find(tree, (el) => el.type === "input");
  input?.props.onChange({ target: { value: "orks" } });
  assert.deepEqual(calls, ["orks"]);
});

test("the clear button only appears once there's a value, and clears it", () => {
  const empty = SearchBar({ value: "", onChange: () => {} });
  assert.equal(find(empty, (el) => el.type === "button"), undefined);

  const calls: string[] = [];
  const filled = SearchBar({ value: "orks", onChange: (v) => calls.push(v) });
  const clearButton = find(filled, (el) => el.type === "button");
  assert.ok(clearButton, "expected a clear button once value is non-empty");
  clearButton!.props.onClick();
  assert.deepEqual(calls, [""]);
});
