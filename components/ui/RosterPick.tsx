"use client";

import { Avatar } from "./Avatar";
import { useData } from "@/lib/data/context";
import type { Member } from "@/lib/types";

/**
 * "Which one are you?"
 *
 * Typing your name works too, but tapping it is what keeps one person from
 * becoming three: a device is an identity, and without this a phone and a
 * laptop are two strangers who both answer to Chris — which quietly doubles
 * your column in the settle-up.
 */
export function RosterPick({
  roster,
  onPick,
  tone = "light",
}: {
  roster: Member[];
  onPick: (memberId: string) => void;
  tone?: "light" | "dark";
}) {
  const { memberAvatars } = useData();
  if (!roster.length) return null;

  return (
    <div className="grid gap-2">
      <div
        className={`font-mono text-[10.5px] tracking-[.1em] uppercase ${
          tone === "dark" ? "text-sky" : "text-granite"
        }`}
      >
        Tap your name
      </div>
      <div className="flex flex-wrap gap-1.5">
        {roster.map((m) => (
          <button
            key={m.id}
            onClick={() => onPick(m.id)}
            // Labelled, or the avatar's monogram reads out as a stray letter.
            aria-label={`I'm ${m.name}`}
            className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 min-h-[36px] rounded-full border cursor-pointer text-[13px] ${
              tone === "dark"
                ? "border-granite bg-pinelift text-parchment"
                : "border-rule bg-transparent text-ink"
            }`}
          >
            <Avatar userId={m.id} url={memberAvatars[m.id]} name={m.name} size={22} />
            <span className="truncate max-w-[104px]">{m.name}</span>
          </button>
        ))}
      </div>
      <div
        className={`font-mono text-[10.5px] ${
          tone === "dark" ? "text-sky" : "text-mute"
        }`}
      >
        or type a new one
      </div>
    </div>
  );
}
