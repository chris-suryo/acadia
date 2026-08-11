"use client";

import { useEffect } from "react";

/** Registers the offline worker once the page is idle. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const id = setTimeout(() => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((e) => console.warn("sw registration failed", e));
    }, 1200);
    return () => clearTimeout(id);
  }, []);
  return null;
}
