/**
 * Writes that wait for signal.
 *
 * Blackwoods has almost no bars. Reads already cope — every table is mirrored
 * to localStorage — but a write with no signal used to fail, apologise, and
 * undo itself, which is most of a weekend at this campground.
 *
 * The distinction that makes waiting safe is *why* a write failed:
 *
 *   - The server answered and refused it (a constraint, a bad column). The
 *     optimistic change is wrong. Report it, revert, and carry on with the
 *     rest of the queue — retrying would fail identically forever.
 *   - The request never arrived at all. The write is still valid and only the
 *     network is missing, so it waits, and so does everything behind it.
 *
 * Order is preserved strictly. Two taps on the same checkbox are "on" then
 * "off"; draining them out of order leaves it on.
 */

export type WriteResult = { error: unknown };
export type Job<T> = { make: () => PromiseLike<WriteResult>; table: T };

export type Outbox<T> = {
  /** Queue a write behind whatever is already waiting. */
  push: (job: Job<T>) => void;
  /** Try to drain. Resolves when the queue empties or the network refuses. */
  flush: () => Promise<void>;
  size: () => number;
  /** Tables touched by writes that landed during the last drain. */
  drained: () => T[];
};

export function createOutbox<T>(opts: {
  /** The server considered this write and said no. */
  onServerError: (table: T, error: unknown) => void;
  onSizeChange?: (size: number) => void;
}): Outbox<T> {
  const queue: Job<T>[] = [];
  let flushing = false;
  let landed: T[] = [];
  const changed = () => opts.onSizeChange?.(queue.length);

  return {
    push(job) {
      queue.push(job);
      changed();
    },
    size: () => queue.length,
    drained: () => landed,
    async flush() {
      if (flushing) return;
      flushing = true;
      landed = [];
      try {
        while (queue.length) {
          const job = queue[0];
          try {
            const { error } = await job.make();
            // A refusal is still an answer: the job is done being tried.
            if (error) opts.onServerError(job.table, error);
          } catch {
            // Nothing reached the server. Keep this job and everything after
            // it, in order, for the next attempt.
            break;
          }
          queue.shift();
          if (!landed.includes(job.table)) landed.push(job.table);
          changed();
        }
      } finally {
        flushing = false;
        changed();
      }
    },
  };
}
