"use client";

// The Blackwoods loop map, full screen. Global pinch zoom is disabled, so
// zoom is a one-thumb tap: fit-width <-> 2.6x centered on the tapped point.

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const MAP_SRC = "/maps/blackwoods-map.png";
const MAP_RATIO = 3024 / 1836;
const ZOOM = 2.6;

/** Warms the browser cache so the overlay opens with no visible load. */
export function useMapPrefetch() {
  useEffect(() => {
    const img = new Image();
    img.src = MAP_SRC;
  }, []);
}

export function MapOverlay({ onClose }: { onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);

  const toggle = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const next = !zoomed;
    setZoomed(next);
    requestAnimationFrame(() => {
      const c = scroller.current;
      if (!c || !next) return;
      const imgW = c.clientWidth * ZOOM;
      c.scrollLeft = fx * imgW - c.clientWidth / 2;
      c.scrollTop = fy * imgW * MAP_RATIO - c.clientHeight / 2;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#23271F]/95">
      <button
        onClick={onClose}
        aria-label="Close map"
        className="fixed top-3 right-3 z-50 w-11 h-11 rounded-full bg-[#23271F]/80 border border-[#4A5A64] text-[#F7F3E8] flex items-center justify-center cursor-pointer"
      >
        <X size={20} />
      </button>
      <div ref={scroller} className="w-full h-full overflow-auto overscroll-contain">
        {/* eslint-disable-next-line @next/next/no-img-element -- repo-hosted map */}
        <img
          src={MAP_SRC}
          alt="Blackwoods campground map"
          onClick={toggle}
          className={
            zoomed
              ? "block max-w-none h-auto cursor-zoom-out"
              : "block w-full h-auto cursor-zoom-in mt-14"
          }
          style={zoomed ? { width: `${ZOOM * 100}%` } : undefined}
        />
      </div>
      <div className="fixed bottom-3 inset-x-0 text-center font-mono text-[10.5px] text-[#CFCABC] pointer-events-none">
        tap the map to {zoomed ? "fit" : "zoom"}
      </div>
    </div>
  );
}
