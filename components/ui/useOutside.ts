"use client";

import { useEffect, useRef } from "react";

/** Calls onOutside when a pointer goes down outside the referenced element. */
export function useOutside(
  active: boolean,
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
) {
  const cb = useRef(onOutside);
  useEffect(() => {
    cb.current = onOutside;
  });
  useEffect(() => {
    if (!active) return;
    const h = (e: PointerEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) cb.current();
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [active, ref]);
}
