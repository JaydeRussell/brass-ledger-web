import { test } from "node:test";
import assert from "node:assert/strict";
import FollowingPill from "./followingPill.tsx";
import { find } from "../../lib/testUtils.ts";

test("shows the followed label", () => {
  const tree = FollowingPill({ label: "Team Ultramarines", onStop: () => {} });
  // The span's children is `["Following ", label]` — JSX splits text mixed
  // with an expression into an array of children rather than one string.
  const span = find(tree, (el) => el.type === "span" && Array.isArray(el.props.children));
  assert.deepEqual(span?.props.children, ["Following ", "Team Ultramarines"]);
});

test("the stop button is labeled for this specific label and calls onStop", () => {
  let stopped = false;
  const tree = FollowingPill({ label: "Bob", onStop: () => (stopped = true) });
  const stopButton = find(tree, (el) => el.type === "button");
  assert.equal(stopButton?.props["aria-label"], "Stop following Bob");
  stopButton!.props.onClick();
  assert.equal(stopped, true);
});
