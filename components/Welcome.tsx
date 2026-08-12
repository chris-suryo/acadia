"use client";

// First open: which of us are you, then your photo, then the app.
//
// That's the whole thing. The questionnaire that used to sit behind this moved
// to the Ideas board on the Itinerary, which already edits every one of its
// fields — it stopped being worth standing between someone and the trip.
//
// Every exit calls onDone, which is the only writer of the `abc.welcomed` flag;
// a path that skips it re-shows the intro forever.

import { useState } from "react";
import { Btn, Input } from "./primitives";
import { RosterPick } from "./ui/RosterPick";
import { AvatarCrop } from "./ui/AvatarCrop";
import { Topo } from "./Header";
import { useData } from "@/lib/data/context";

/** The pine field both steps sit on, so only the content changes between them. */
export function IntroField({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-pine relative overflow-hidden flex flex-col justify-center px-6 pt-[calc(env(safe-area-inset-top)+32px)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
      <Topo />
      <div className="relative w-full max-w-[400px] mx-auto">{children}</div>
    </div>
  );
}

/** Date line + title. Also the splash, so the hand-off into step one is silent. */
export function IntroMasthead() {
  return (
    <>
      <div className="font-mono text-[11px] tracking-[.12em] text-blazelift uppercase mb-2">
        Aug 14–16, 2026 · Blackwoods Campground
      </div>
      <h1 className="font-display font-bold text-[clamp(32px,9vw,44px)] text-parchment m-0 leading-[1.05]">
        Acadia Base Camp
      </h1>
    </>
  );
}

export function Welcome({ onDone }: { onDone: () => void }) {
  const { name, setName, members, claimMember } = useData();
  const [step, setStep] = useState<1 | 2>(1);
  // A replay is for changing your mind, not introducing yourself: someone who
  // already has a name opens on the text field, with the list a tap away.
  const [typing, setTyping] = useState(!!name.trim());
  const [nm, setNm] = useState(name);

  const toPhoto = () => setStep(2);

  const commitTyped = () => {
    if (!nm.trim()) return;
    setName(nm.trim());
    toPhoto();
  };

  if (step === 1) {
    return (
      <IntroField>
        <div key="who" className="animate-[fadein_.22s_ease-out]">
          <IntroMasthead />
          <div className="mt-7">
            {members.length > 0 && !typing ? (
              <>
                <RosterPick roster={members} tone="dark" onPick={(id) => {
                  claimMember(id);
                  toPhoto();
                }} />
                {/* Everyone coming is already on that list, so typing a name is
                    the exception. Left as the default it's how a phantom
                    twelfth person gets invented. */}
                <button
                  onClick={() => setTyping(true)}
                  className="block mt-4 bg-transparent border-none cursor-pointer p-0 font-mono text-[10.5px] text-sky underline underline-offset-2"
                >
                  not on the list?
                </button>
              </>
            ) : (
              <>
                <Input
                  value={nm}
                  onChange={(e) => setNm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTyped();
                  }}
                  placeholder="Your name"
                  aria-label="Your name"
                  enterKeyHint="next"
                  autoComplete="given-name"
                  className="mb-3"
                />
                <Btn onClick={commitTyped} full>
                  Continue
                </Btn>
                {members.length > 0 && (
                  <button
                    onClick={() => setTyping(false)}
                    className="block mx-auto mt-3 bg-transparent border-none cursor-pointer p-0 font-mono text-[10.5px] text-sky underline underline-offset-2"
                  >
                    back to the list
                  </button>
                )}
              </>
            )}
          </div>
          <button
            onClick={onDone}
            className="block mx-auto mt-7 bg-transparent border-none cursor-pointer font-mono text-[11px] text-sky underline underline-offset-2"
          >
            skip for now
          </button>
        </div>
      </IntroField>
    );
  }

  return (
    <IntroField>
      <div key="photo" className="animate-[fadein_.22s_ease-out]">
        <div className="font-mono text-[11px] tracking-[.12em] text-blazelift uppercase mb-2">
          Hey {name.trim() || "there"}
        </div>
        <h1 className="font-display font-bold text-[clamp(26px,7vw,34px)] text-parchment m-0 leading-[1.08]">
          Add a photo
        </h1>
        <p className="text-[14px] text-sky mt-2.5 mb-6 leading-[1.55]">
          A list of faces beats a list of initials. You can always add one later.
        </p>
        <AvatarCrop size={210} tone="dark" onSaved={onDone} />
        <button
          onClick={onDone}
          className="block mx-auto mt-6 bg-transparent border-none cursor-pointer font-mono text-[11px] text-sky underline underline-offset-2"
        >
          skip
        </button>
      </div>
    </IntroField>
  );
}
