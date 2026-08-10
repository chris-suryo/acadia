"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** v4 gate behavior: scroll to top, focus the name input after the scroll
 *  starts, flash a blaze ring for 2.2s. */
export function useNameGate(name: string) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [nameFlash, setNameFlash] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const requireName = useCallback(() => {
    if (name.trim()) return true;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setNameFlash(true);
    timers.current.push(setTimeout(() => nameInputRef.current?.focus(), 350));
    timers.current.push(setTimeout(() => setNameFlash(false), 2200));
    return false;
  }, [name]);

  return { nameInputRef, nameFlash, requireName };
}
