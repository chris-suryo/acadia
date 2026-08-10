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

export function Header() {
  const { name, setName } = useData();

  return (
    <header className="bg-pine relative overflow-hidden px-[18px] pt-[26px] pb-[22px]">
      <Topo />
      <div className="relative flex justify-between items-end gap-3.5 flex-wrap">
        <div>
          <div className="font-mono text-[11px] tracking-[.12em] text-blaze uppercase mb-1.5">
            Aug 14–16, 2026 · Blackwoods Campground
          </div>
          <h1 className="font-display font-bold text-[clamp(28px,7vw,40px)] text-parchment m-0 leading-[1.05]">
            Acadia Base Camp
          </h1>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          className="text-[16px] px-3 py-[9px] rounded-md bg-pinelift text-parchment w-[150px] min-h-[42px] border-[1.5px] border-granite placeholder:text-sky"
        />
      </div>
    </header>
  );
}
