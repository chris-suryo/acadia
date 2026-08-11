"use client";

// First-open intro: name first, then the questionnaire — options to tap, two
// short type-ins, one screen. Every exit path calls onDone; answers prefill
// from the existing row so a replay edits instead of blanking.

import { useState } from "react";
import { Btn, Input } from "./primitives";
import { Chips, MultiChips } from "./ui/Chips";
import { Topo } from "./Header";
import { useData } from "@/lib/data/context";

// The vibe check: pick-any weekend shapes, one pace, and what's stored where
// (survey columns predate this shape: wants = vibes joined, hikes = the
// anything-else line).
export const VIBE_CHIPS = [
  "Big hikes",
  "Easy walks",
  "Swimming",
  "Sunsets + views",
  "Camp hangs",
  "Bar Harbor",
] as const;

export const PACE_CHIPS = [
  { value: "Up early, do it all", label: "Up early, do it all" },
  { value: "One good hike", label: "One good hike" },
  { value: "Wander, no plan", label: "Wander, no plan" },
];

export const SURVEY_PLACEHOLDERS = {
  food: "s'mores night, a dish, allergies…",
  extra: "Beehive, lobster roll, a shop in town…",
} as const;

export const splitVibes = (s: string) => s.split(" · ").filter(Boolean);

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
  const { name, setName, upsertSurvey, surveys, userId } = useData();
  const mine = surveys.find((s) => s.user_id === userId);
  const [step, setStep] = useState<1 | 2>(1);
  const [nm, setNm] = useState(name);
  const [vibes, setVibes] = useState<string[]>(splitVibes(mine?.wants ?? ""));
  const [pace, setPace] = useState(mine?.activity ?? "");
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
      food: food.trim(),
      hikes: extra.trim(),
    };
    const before = {
      activity: mine?.activity ?? "",
      wants: mine?.wants ?? "",
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
          <p className="text-[14px] text-sky mt-3 mb-9 leading-[1.55]">
            12 of us · 2 sites · 3 days on the island
          </p>
          <label className="block text-[15px] font-medium text-parchment mb-2">
            What&apos;s your name?
          </label>
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
        <Field label="Pick any">
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
