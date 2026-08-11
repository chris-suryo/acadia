"use client";

import { useEffect } from "react";
import { OFFLINE_MEDIA } from "@/lib/content";

/** Registers the offline worker once the page is idle, then hands it the
 *  trip's imagery to pull down while there's still a network. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
        const reg = await navigator.serviceWorker.ready;
        if (cancelled) return;
        // Hand off the media list only once the browser is otherwise idle —
        // `ready` resolves with an active worker, so this reaches a worker
        // that can answer even on the very first visit, before it controls
        // the page.
        const send = () =>
          reg.active?.postMessage({ type: "precache", urls: OFFLINE_MEDIA });
        if ("requestIdleCallback" in window)
          window.requestIdleCallback(send, { timeout: 5000 });
        else setTimeout(send, 2000);
      } catch (e) {
        console.warn("sw registration failed", e);
      }
    }, 1200);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);
  return null;
}
