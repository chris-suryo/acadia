"use client";

// The Blackwoods loop map, full screen: pinch to zoom, drag to pan, double-tap
// to jump in or back out. The browser's own pinch is disabled app-wide, so the
// gesture comes from usePinchPan.

import { useEffect } from "react";
import { X } from "lucide-react";
import { PinchSurface, usePinchPan } from "./ui/PinchPan";

const MAP_SRC = "/maps/blackwoods-map.png";

/** Warms the browser cache so the overlay opens with no visible load. */
export function useMapPrefetch() {
  useEffect(() => {
    const img = new Image();
    img.src = MAP_SRC;
  }, []);
}

export function MapOverlay({ onClose }: { onClose: () => void }) {
  const { t, surface, handlers } = usePinchPan({ min: 1, max: 6 });

  return (
    <div className="fixed inset-0 z-50 bg-[#23271F]/95">
      <button
        onClick={onClose}
        aria-label="Close map"
        className="fixed top-3 right-3 z-50 w-11 h-11 rounded-full bg-[#23271F]/80 border border-[#4A5A64] text-[#F7F3E8] flex items-center justify-center cursor-pointer"
      >
        <X size={20} />
      </button>
      <PinchSurface t={t} surface={surface} handlers={handlers} className="w-full h-full">
        <div className="w-full h-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- repo-hosted map */}
          <img
            src={MAP_SRC}
            alt="Blackwoods campground map"
            draggable={false}
            className="max-w-full max-h-full w-auto h-auto select-none"
          />
        </div>
      </PinchSurface>
    </div>
  );
}
