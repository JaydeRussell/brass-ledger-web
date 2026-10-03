export type RequestQueue<T> = {
  enqueue: (item: T) => void;
  // Drops everything not yet started; requests already in flight finish.
  clear: () => void;
};

/**
 * Runs `run` for each enqueued item, at most `concurrency` at a time, in
 * the order they were enqueued. Does not de-duplicate — callers track
 * what they have already asked for. A rejected `run` is swallowed so one
 * failure doesn't stall the queue; `run` handles its own errors.
 */
export function createRequestQueue<T>(run: (item: T) => Promise<unknown>, concurrency: number): RequestQueue<T> {
  const pending: T[] = [];
  let active = 0;

  const pump = () => {
    while (active < concurrency && pending.length > 0) {
      const item = pending.shift() as T;
      active++;
      run(item)
        .catch(() => {})
        .finally(() => {
          active--;
          pump();
        });
    }
  };

  return {
    enqueue(item) {
      pending.push(item);
      pump();
    },
    clear() {
      pending.length = 0;
    },
  };
}
