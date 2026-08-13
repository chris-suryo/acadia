"use client";

// A chirped photo, full screen: pinch to zoom, drag to pan, double-tap to
// jump in or back out — the map overlay's chrome, pointed at feed photos.
//
// A post can carry four photos, so this opens on the one you tapped and moves
// between them. Without that, tapping the third photo stranded you on it and
// the only way to the fourth was closing and tapping again.

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PinchSurface, usePinchPan } from "./ui/PinchPan";

export function PhotoLightbox({
  photos,
  index = 0,
  caption,
  onClose,
}: {
  photos: string[];
  /** Which one was tapped. */
  index?: number;
  /** "Alana — Found the loop map" — who chirped it, and what they said. */
  caption?: string;
  onClose: () => void;
}) {
  const [at, setAt] = useState(index);
  const { t, surface, handlers } = usePinchPan({ min: 1, max: 6 });
  const many = photos.length > 1;
  // A fresh pinch/pan surface per photo, so arriving at the next one zoomed
  // into the last one's corner can't happen.
  const step = useCallback(
    (by: number) => setAt((i) => (i + by + photos.length) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    if (!many) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [many, step]);

  const src = photos[at];
  if (!src) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#23271F]/95">
      <button
        onClick={onClose}
        aria-label="Close photo"
        className="fixed top-3 right-3 z-50 w-11 h-11 rounded-full bg-[#23271F]/80 border border-[#4A5A64] text-[#F7F3E8] flex items-center justify-center cursor-pointer"
      >
        <X size={20} />
      </button>
      <PinchSurface
        key={at}
        t={t}
        surface={surface}
        handlers={handlers}
        className="w-full h-full"
      >
        <div className="w-full h-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- user photo */}
          <img
            src={src}
            alt={caption || "Photo"}
            draggable={false}
            className="max-w-full max-h-full w-auto h-auto select-none"
          />
        </div>
      </PinchSurface>

      {many && (
        <>
          <button
            onClick={() => step(-1)}
            aria-label="Previous photo"
            className="fixed left-2 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-[#23271F]/80 border border-[#4A5A64] text-[#F7F3E8] flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => step(1)}
            aria-label="Next photo"
            className="fixed right-2 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-[#23271F]/80 border border-[#4A5A64] text-[#F7F3E8] flex items-center justify-center cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {(caption || many) && (
        <div className="fixed bottom-0 inset-x-0 z-50 px-4 pt-8 pb-[max(16px,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#23271F]/90 to-transparent pointer-events-none">
          <div className="max-w-[640px] mx-auto">
            {many && (
              <div className="font-mono text-[11px] text-[#B9C3AE] mb-1">
                {at + 1} / {photos.length}
              </div>
            )}
            {caption && (
              <p className="text-[13px] leading-snug text-[#F7F3E8] break-words m-0">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
