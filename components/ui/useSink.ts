"use client";

// Checked-items-sink: a just-toggled row holds its position for ~1s, then the
// list re-sorts (checked to the bottom) inside a view transition when the
// browser supports one and motion isn't reduced.

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

// Long enough that a row doesn't leave under your finger, short enough that
// you aren't waiting on it. A second was the former and not the latter.
const SETTLE_MS = 600;

export function useSink() {
  const [unsettled, setUnsettled] = useState<Set<string>>(new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const poke = (id: string) => {
    setUnsettled((prev) => new Set(prev).add(id));
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id);
        const apply = () =>
          setUnsettled((prev) => {
            const n = new Set(prev);
            n.delete(id);
            return n;
          });
        const startVT = (
          document as Document & {
            startViewTransition?: (cb: () => void) => void;
          }
        ).startViewTransition?.bind(document);
        if (startVT && !reduced.current) startVT(() => flushSync(apply));
        else apply();
      }, SETTLE_MS),
    );
  };

  /** Stable partition: active rows keep order, settled-checked rows sink. */
  const sink = <T extends { id: string; checked: boolean }>(rows: T[]): T[] => [
    ...rows.filter((r) => !(r.checked && !unsettled.has(r.id))),
    ...rows.filter((r) => r.checked && !unsettled.has(r.id)),
  ];

  return { poke, sink };
}

export function vtName(id: string): React.CSSProperties {
  return { viewTransitionName: `r${id.replace(/[^a-zA-Z0-9]/g, "")}` };
}
