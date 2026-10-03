import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequestQueue } from "./requestQueue.ts";

function deferred() {
  let resolve!: () => void;
  let reject!: (err: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

test("never runs more than `concurrency` at once, and starts the rest in order as slots free", async () => {
  const started: number[] = [];
  const gates = new Map<number, ReturnType<typeof deferred>>();
  const queue = createRequestQueue<number>((n) => {
    started.push(n);
    const gate = deferred();
    gates.set(n, gate);
    return gate.promise;
  }, 2);

  [1, 2, 3, 4].forEach((n) => queue.enqueue(n));
  assert.deepEqual(started, [1, 2]);

  gates.get(1)!.resolve();
  await tick();
  assert.deepEqual(started, [1, 2, 3]);

  gates.get(2)!.resolve();
  await tick();
  assert.deepEqual(started, [1, 2, 3, 4]);
});

test("a failed run frees its slot instead of stalling the queue", async () => {
  const started: number[] = [];
  const gates = new Map<number, ReturnType<typeof deferred>>();
  const queue = createRequestQueue<number>((n) => {
    started.push(n);
    const gate = deferred();
    gates.set(n, gate);
    return gate.promise;
  }, 1);

  queue.enqueue(1);
  queue.enqueue(2);
  gates.get(1)!.reject(new Error("boom"));
  await tick();
  assert.deepEqual(started, [1, 2]);
});

test("clear drops items not yet started", async () => {
  const started: number[] = [];
  const gate = deferred();
  const queue = createRequestQueue<number>((n) => {
    started.push(n);
    return gate.promise;
  }, 1);

  queue.enqueue(1);
  queue.enqueue(2);
  queue.clear();
  gate.resolve();
  await tick();
  assert.deepEqual(started, [1]);
});
