import { test } from "node:test";
import assert from "node:assert/strict";

import { radioGroupKeyDown } from "./radioGroup.ts";

type FakeRadio = { disabled: boolean; focused: boolean; clicked: number; focus(): void; click(): void };

function group(n: number, active: number, disabledAt: number[] = []) {
  const radios: FakeRadio[] = Array.from({ length: n }, (_, i) => ({
    disabled: disabledAt.includes(i),
    focused: i === active,
    clicked: 0,
    focus() {
      radios.forEach((r) => (r.focused = false));
      this.focused = true;
    },
    click() {
      this.clicked++;
    },
  }));
  (globalThis as unknown as { document: { activeElement: unknown } }).document = {
    get activeElement() {
      return radios.find((r) => r.focused);
    },
  };
  const press = (key: string, opts?: { select?: boolean }) => {
    let prevented = false;
    radioGroupKeyDown(
      {
        key,
        preventDefault: () => (prevented = true),
        currentTarget: { querySelectorAll: () => radios.filter((r) => !r.disabled) },
      } as never,
      opts
    );
    return prevented;
  };
  return { radios, press };
}

test("arrows move focus and select, wrapping at the ends", () => {
  const { radios, press } = group(3, 0);
  press("ArrowRight");
  assert.equal(radios[1].focused, true);
  assert.equal(radios[1].clicked, 1);
  press("ArrowLeft");
  press("ArrowLeft");
  assert.equal(radios[2].focused, true, "wraps from the first to the last");
});

test("Home and End jump; disabled radios are skipped", () => {
  const { radios, press } = group(4, 1, [3]);
  press("End");
  assert.equal(radios[2].focused, true, "the disabled last radio is skipped");
  press("Home");
  assert.equal(radios[0].focused, true);
});

test("select: false only moves focus; other keys are left alone", () => {
  const { radios, press } = group(3, 0);
  press("ArrowDown", { select: false });
  assert.equal(radios[1].focused, true);
  assert.equal(radios[1].clicked, 0);
  assert.equal(press("Enter"), false, "Enter keeps the button's own behaviour");
});
