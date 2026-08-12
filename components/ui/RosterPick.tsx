"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { Btn } from "@/components/primitives";
import { useData } from "@/lib/data/context";
import type { Member } from "@/lib/types";

/**
 * "Which one are you?"
 *
 * The party is a closed list of people who all know each other, so this isn't
 * authentication — it's attendance. Nobody needs an account; they need to say
 * which of eleven names is theirs, once, and have it stick.
 *
 * That makes the failure modes accidents rather than attacks: tapping the name
 * next to yours, finding your name already taken and not knowing whether that's
 * fine, or clearing Safari and coming back a stranger. So names already on
 * somebody's phone read as taken, tapping one asks instead of quietly stealing
 * it, and every choice is reversible.
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
  const { memberAvatars, claimedMembers } = useData();
  const [confirming, setConfirming] = useState<Member | null>(null);
  const dark = tone === "dark";

  if (!roster.length) return null;

  if (confirming) {
    return (
      <div className="grid gap-2.5">
        <div className={`text-[14px] leading-[1.5] ${dark ? "text-parchment" : "text-ink"}`}>
          <strong>{confirming.name}</strong> is already set up on a phone. If
          that&apos;s you on a second device, carry on — otherwise pick again.
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const m = confirming;
              setConfirming(null);
              onPick(m.id);
            }}
            className="flex-1 px-3 py-2 min-h-[42px] rounded-full border border-blaze bg-blaze text-white cursor-pointer font-mono text-[11px] uppercase tracking-[.07em]"
          >
            That&apos;s me
          </button>
          <button
            onClick={() => setConfirming(null)}
            className={`flex-1 px-3 py-2 min-h-[42px] rounded-full border cursor-pointer font-mono text-[11px] uppercase tracking-[.07em] ${
              dark ? "border-granite text-parchment" : "border-rule text-granite"
            }`}
          >
            Pick again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div
        className={`font-mono text-[10.5px] tracking-[.1em] uppercase ${
          dark ? "text-sky" : "text-granite"
        }`}
      >
        Tap your name
      </div>
      <div className="flex flex-wrap gap-1.5">
        {roster.map((m) => {
          const taken = claimedMembers.includes(m.id);
          return (
            <button
              key={m.id}
              // Labelled, or the avatar's monogram reads out as a stray letter.
              aria-label={taken ? `I'm ${m.name} (already claimed)` : `I'm ${m.name}`}
              onClick={() => (taken ? setConfirming(m) : onPick(m.id))}
              // Taken names have to read as taken at a glance, or the
              // difference looks like a rendering glitch rather than a fact.
              className={`flex items-center gap-2 pl-1 pr-3 py-1 min-h-[44px] rounded-full border cursor-pointer text-[14px] transition-opacity ${
                taken ? "opacity-45 " : ""
              }${
                dark
                  ? "border-granite bg-pinelift text-parchment"
                  : taken
                    ? "border-rule bg-transparent text-ink"
                    : "border-moss bg-[#E9EEE4] text-ink"
              }`}
            >
              <Avatar userId={m.id} url={memberAvatars[m.id]} name={m.name} size={30} />
              <span className="truncate max-w-[110px]">{m.name}</span>
            </button>
          );
        })}
      </div>
      {/* Only worth saying once something is actually faded — otherwise it
          describes a distinction nobody can see yet. */}
      {roster.some((m) => claimedMembers.includes(m.id)) && (
        <div className={`font-mono text-[10.5px] ${dark ? "text-sky" : "text-mute"}`}>
          faded names are already on someone&apos;s phone
        </div>
      )}
    </div>
  );
}

/** "Not you?" — a mis-tap should be a two-tap fix, not a text to Chris. */
export function SwitchPerson({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { members, claimMember, myMemberId } = useData();
  const [open, setOpen] = useState(false);
  const dark = tone === "dark";

  if (!members.length) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`bg-transparent border-none cursor-pointer p-0 font-mono text-[10.5px] underline underline-offset-2 ${
          dark ? "text-sky" : "text-blaze"
        }`}
      >
        not you?
      </button>
    );
  }

  return (
    <div className="grid gap-2">
      <RosterPick
        roster={members.filter((m) => m.id !== myMemberId)}
        tone={tone}
        onPick={(id) => {
          claimMember(id);
          setOpen(false);
        }}
      />
      <Btn small onClick={() => setOpen(false)}>
        Never mind
      </Btn>
    </div>
  );
}
