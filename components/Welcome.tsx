"use client";

// First-open intro: name first, then the questionnaire — options to tap, two
// short type-ins, one screen. Every exit path calls onDone; answers prefill
// from the existing row so a replay edits instead of blanking.

import { useState } from "react";
import { Camera } from "lucide-react";
import { Btn, Input } from "./primitives";
import { Chips, MultiChips } from "./ui/Chips";
import { RosterPick } from "./ui/RosterPick";
import { Topo } from "./Header";
import { AvatarEditor } from "./AvatarEditor";
import { useData } from "@/lib/data/context";

// The vibe check, in plain language a first-timer can answer. Survey columns
// predate this shape: wants = vibes joined, hikes = the anything-else line,
// bar_harbor = camping experience.
export const VIBE_CHIPS = [
  "A big hike",
  "Easy walks",
  "Swimming",
  "Views + sunsets",
  "Hanging at camp",
  "Town food + shops",
] as const;

export const PACE_CHIPS = [
  { value: "Up early, do it all", label: "Up early, do it all" },
  { value: "One good hike", label: "One good hike" },
  { value: "Wander, no plan", label: "Wander, no plan" },
];

export const EXPERIENCE_CHIPS = [
  { value: "First timer", label: "First timer" },
  { value: "Done it a bit", label: "Done it a bit" },
  { value: "Old hand", label: "Old hand" },
];

export const SURVEY_PLACEHOLDERS = {
  food: "s'mores night, a dish, allergies…",
  extra: "anything you're hoping to do or see…",
} as const;

// Answers picked under earlier label sets still live in the column; translate
// on read and drop repeats so a card never shows two vocabularies.
const VIBE_ALIASES: Record<string, string> = {
  "Big hikes": "A big hike",
  "Sunsets + views": "Views + sunsets",
  "Camp hangs": "Hanging at camp",
  "Bar Harbor": "Town food + shops",
};

export const splitVibes = (s: string): string[] => {
  const out: string[] = [];
  for (const raw of s.split(" · ")) {
    const v = raw.trim();
    if (!v) continue;
    const label = VIBE_ALIASES[v] ?? v;
    if (!out.includes(label)) out.push(label);
  }
  return out;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10.5px] tracking-[.1em] uppercase text-granite mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

export function Welcome({ onDone }: { onDone: () => void }) {
  const { name, setName, upsertSurvey, surveys, userId, avatars, members, claimMember } =
    useData();
  const mine = surveys.find((s) => s.user_id === userId);
  const myAvatar = avatars[userId];
  const [photoOpen, setPhotoOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [nm, setNm] = useState(name);
  const [vibes, setVibes] = useState<string[]>(splitVibes(mine?.wants ?? ""));
  const [pace, setPace] = useState(mine?.activity ?? "");
  const [exp, setExp] = useState(mine?.bar_harbor ?? "");
  const [food, setFood] = useState(mine?.food ?? "");
  const [extra, setExtra] = useState(mine?.hikes ?? "");

  const continueToSurvey = () => {
    if (!nm.trim()) return;
    setName(nm.trim());
    setStep(2);
  };

  const finish = () => {
    const patch = {
      activity: pace,
      wants: vibes.join(" · "),
      bar_harbor: exp,
      food: food.trim(),
      hikes: extra.trim(),
    };
    const before = {
      activity: mine?.activity ?? "",
      wants: mine?.wants ?? "",
      bar_harbor: mine?.bar_harbor ?? "",
      food: mine?.food ?? "",
      hikes: mine?.hikes ?? "",
    };
    if (JSON.stringify(patch) !== JSON.stringify(before)) upsertSurvey(patch);
    onDone();
  };

  if (step === 1) {
    return (
      <div className="min-h-[100dvh] bg-pine relative overflow-hidden flex flex-col justify-center px-6 py-10">
        <Topo />
        <div className="relative w-full max-w-[400px] mx-auto">
          <div className="font-mono text-[11px] tracking-[.12em] text-blaze uppercase mb-2">
            Aug 14–16, 2026 · Blackwoods Campground
          </div>
          <h1 className="font-display font-bold text-[clamp(32px,9vw,44px)] text-parchment m-0 leading-[1.05]">
            Acadia Base Camp
          </h1>
          <p className="text-[14px] text-sky mt-3 mb-7 leading-[1.55]">
            12 of us · 2 sites · 3 days on the island
          </p>
          <AvatarEditor open={photoOpen} onClose={() => setPhotoOpen(false)} />
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setPhotoOpen(true)}
              aria-label="Add a photo"
              className="w-16 h-16 rounded-full border-[1.5px] border-granite bg-pinelift flex items-center justify-center overflow-hidden shrink-0 cursor-pointer p-0"
            >
              {myAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- user avatar
                <img src={myAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-sky" />
              )}
            </button>
            <span className="font-mono text-[10.5px] text-sky">
              {myAvatar ? "looking good" : "add a photo — optional"}
            </span>
          </div>
          <label className="block text-[15px] font-medium text-parchment mb-2">
            What&apos;s your name?
          </label>
          {members.length > 0 && (
            <div className="mb-3">
              <RosterPick
                roster={members}
                tone="dark"
                onPick={(id) => {
                  claimMember(id);
                  setStep(2);
                }}
              />
            </div>
          )}
          <Input
            value={nm}
            onChange={(e) => setNm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") continueToSurvey();
            }}
            placeholder="Your name"
            aria-label="Your name"
            enterKeyHint="next"
            autoComplete="given-name"
            className="mb-3"
          />
          <Btn onClick={continueToSurvey} full>
            Continue
          </Btn>
          <button
            onClick={onDone}
            className="block mx-auto mt-6 bg-transparent border-none cursor-pointer font-mono text-[11px] text-sky underline underline-offset-2"
          >
            skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-parchment">
      <div className="bg-pine relative overflow-hidden px-[18px] pt-4 pb-3.5">
        <Topo />
        <div className="relative">
          <div className="font-mono text-[10.5px] tracking-[.12em] text-blaze uppercase mb-1">
            Hey {name.trim() || "there"}
          </div>
          <h1 className="font-display font-bold text-[22px] text-parchment m-0 leading-[1.1]">
            What kind of weekend?
          </h1>
        </div>
      </div>
      <div className="max-w-[640px] mx-auto px-3.5 pt-4 pb-10 grid gap-4">
        <Field label="Camped before?">
          <Chips
            options={EXPERIENCE_CHIPS}
            value={exp}
            onChange={(v) => setExp(v === exp ? "" : v)}
          />
        </Field>
        <Field label="Pick what sounds good">
          <MultiChips
            options={VIBE_CHIPS}
            values={vibes}
            onToggle={(v) =>
              setVibes((prev) =>
                prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
              )
            }
          />
        </Field>
        <Field label="Saturday pace">
          <Chips
            options={PACE_CHIPS}
            value={pace}
            onChange={(v) => setPace(v === pace ? "" : v)}
          />
        </Field>
        <Field label="Food requests">
          <Input
            value={food}
            onChange={(e) => setFood(e.target.value)}
            placeholder={SURVEY_PLACEHOLDERS.food}
            enterKeyHint="next"
          />
        </Field>
        <Field label="Anything else?">
          <Input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") finish();
            }}
            placeholder={SURVEY_PLACEHOLDERS.extra}
            enterKeyHint="done"
          />
        </Field>
        <Btn onClick={finish} full>
          Done
        </Btn>
        <button
          onClick={onDone}
          className="block mx-auto -mt-1 bg-transparent border-none cursor-pointer font-mono text-[11px] text-granite underline underline-offset-2"
        >
          skip
        </button>
      </div>
    </div>
  );
}
