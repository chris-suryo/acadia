"use client";

// public/maps/blackwoods-map.png — the official recreation.gov campground
// PDF (page 1), rasterized at 3x. Site numbers stay legible zoomed in.
export const HAS_CAMPGROUND_MAP = true;

import { useState } from "react";
import { ExternalLink, Map as MapIcon, X } from "lucide-react";
import { Card } from "./primitives";
import { MAP_PDF_URL } from "@/lib/content";

const MAP_SRC = "/maps/blackwoods-map.png";

export function MapLightbox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full bg-transparent border-none p-0 cursor-pointer text-left"
      >
        <Card className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MAP_SRC}
            alt="Blackwoods campground map"
            className="w-full h-auto block"
          />
          <div className="px-[13px] py-[11px] flex gap-[11px] items-center border-t border-rule">
            <MapIcon size={17} className="text-blaze shrink-0" />
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-ink">
                Blackwoods — loops & site numbers
              </div>
              <div className="font-mono text-[10.5px] text-mute mt-0.5">
                tap to zoom
              </div>
            </div>
          </div>
        </Card>
      </button>
      <a
        href={MAP_PDF_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-1.5 text-[12px] font-semibold text-blaze no-underline"
      >
        Official PDF <ExternalLink size={11} />
      </a>

      {open && (
        <div className="fixed inset-0 z-50 bg-[#23271F]/95 overflow-auto overscroll-contain">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close map"
            className="fixed top-3 right-3 z-50 w-11 h-11 rounded-full bg-[#23271F]/80 border border-[#4A5A64] text-[#F7F3E8] flex items-center justify-center cursor-pointer"
          >
            <X size={20} />
          </button>
          <div className="min-w-fit min-h-full flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MAP_SRC}
              alt="Blackwoods campground map — full size"
              className="w-[200vw] max-w-none sm:w-auto sm:max-w-full h-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
