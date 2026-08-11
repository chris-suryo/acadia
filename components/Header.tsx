"use client";

import { useData } from "@/lib/data/context";

const TOPO_YS = [10, 30, 50, 72, 96, 122, 148];

// Contour-line backdrop for pine bands (header, welcome intro).
export function Topo() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full opacity-[.16]"
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
    >
      {TOPO_YS.map((y, i) => (
        <path
          key={y}
          d={`M0 ${y} C 60 ${y - 18}, 100 ${y + 22}, 160 ${y - 6} S 260 ${y - 30}, 320 ${y + 4} S 380 ${y - 10}, 400 ${y}`}
          fill="none"
          stroke="#F7F3E8"
          strokeWidth={i % 3 === 0 ? 1.4 : 0.7}
        />
      ))}
    </svg>
  );
}

// Names are set once in the intro (or the name sheet) — the header just
// greets. Editing lives behind "replay the intro" on Explore.
export function Header() {
  const { name } = useData();

  return (
    // In the installed app the pine flows under the iOS status bar
    // (viewport-fit=cover + translucent status bar); the safe-area padding
    // keeps the text below the clock.
    <header className="bg-pine relative overflow-hidden px-[18px] pb-[22px] pt-[calc(env(safe-area-inset-top)+30px)]">
      <Topo />
      <div className="relative flex justify-between items-end gap-3.5">
        <div className="min-w-0">
          <div className="font-mono text-[11px] tracking-[.12em] text-blaze uppercase mb-1.5">
            Aug 14–16, 2026 · Blackwoods
          </div>
          <h1 className="font-display font-bold text-[clamp(27px,7vw,36px)] text-parchment m-0 leading-[1.05]">
            Acadia Base Camp
          </h1>
        </div>
        {name.trim() && (
          <div className="text-[13px] text-sky pb-0.5 shrink-0">
            Hi {name.trim()}
          </div>
        )}
      </div>
    </header>
  );
}
