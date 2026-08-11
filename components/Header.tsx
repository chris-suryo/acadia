"use client";

import { useState } from "react";
import { AvatarEditor } from "./AvatarEditor";
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
// greets, with the profile photo (or a monogram) in the corner.
export function Header() {
  const { name, avatars, userId } = useData();
  const myAvatar = avatars[userId];
  const [editing, setEditing] = useState(false);

  return (
    // In the installed app the pine flows under the iOS status bar
    // (viewport-fit=cover + translucent status bar); the safe-area padding
    // keeps the text below the clock.
    <header className="bg-pine relative overflow-hidden px-[18px] pb-[22px] pt-[calc(env(safe-area-inset-top)+30px)]">
      <Topo />
      <div className="relative flex justify-between items-start gap-4">
        <div className="min-w-0">
          <div className="font-mono text-[11px] tracking-[.12em] text-blaze uppercase mb-1.5">
            Aug 14–16, 2026 · Blackwoods
          </div>
          <h1 className="font-display font-bold text-[clamp(27px,7vw,36px)] text-parchment m-0 leading-[1.05]">
            Acadia Base Camp
          </h1>
        </div>
        {name.trim() && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit your photo"
            className="flex flex-col items-center gap-1 shrink-0 -mt-0.5 bg-transparent border-none p-0 cursor-pointer"
          >
            <span className="w-10 h-10 rounded-full overflow-hidden border border-granite bg-pinelift flex items-center justify-center">
              {myAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- user avatar
                <img src={myAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-bold text-[16px] text-parchment">
                  {name.trim().charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="font-mono text-[10px] text-sky max-w-[72px] truncate">
              {name.trim()}
            </span>
          </button>
        )}
      </div>
      <AvatarEditor open={editing} onClose={() => setEditing(false)} />
    </header>
  );
}
