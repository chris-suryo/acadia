"use client";

// A chirped photo, full screen: pinch to zoom, drag to pan, double-tap to
// jump in or back out — the map overlay's chrome, pointed at feed photos.

import { X } from "lucide-react";
import { PinchSurface, usePinchPan } from "./ui/PinchPan";

export function PhotoLightbox({
  src,
  caption,
  onClose,
}: {
  src: string;
  /** "Alana — Found the loop map" — who chirped it, and what they said. */
  caption?: string;
  onClose: () => void;
}) {
  const { t, surface, handlers } = usePinchPan({ min: 1, max: 6 });

  return (
    <div className="fixed inset-0 z-50 bg-[#23271F]/95">
      <button
        onClick={onClose}
        aria-label="Close photo"
        className="fixed top-3 right-3 z-50 w-11 h-11 rounded-full bg-[#23271F]/80 border border-[#4A5A64] text-[#F7F3E8] flex items-center justify-center cursor-pointer"
      >
        <X size={20} />
      </button>
      <PinchSurface t={t} surface={surface} handlers={handlers} className="w-full h-full">
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
      {caption ? (
        <div className="fixed bottom-0 inset-x-0 z-50 px-4 pt-8 pb-[max(16px,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#23271F]/90 to-transparent pointer-events-none">
          <p className="max-w-[640px] mx-auto text-[13px] leading-snug text-[#F7F3E8] break-words">
            {caption}
          </p>
        </div>
      ) : null}
    </div>
  );
}
