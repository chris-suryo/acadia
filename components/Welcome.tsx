"use client";

// First-open intro: name first, then the trip questionnaire. Every exit path
// calls onDone — the shell records the visit and never shows this again;
// answers are editable later on the Ideas board.

import { useState } from "react";
import { Btn, Input, Textarea } from "./primitives";
import { Chips } from "./ui/Chips";
import { Topo } from "./Header";
import { useData } from "@/lib/data/context";

export const ACTIVITY_CHIPS = [
  { value: "Easy", label: "Easy" },
  { value: "A hike a day", label: "A hike a day" },
  { value: "Send it", label: "Send it" },
];

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
  const { name, setName, upsertSurvey } = useData();
  const [step, setStep] = useState<1 | 2>(1);
  const [nm, setNm] = useState(name);
  const [activity, setActivity] = useState("");
  const [hikes, setHikes] = useState("");
  const [wants, setWants] = useState("");
  const [barHarbor, setBarHarbor] = useState("");
  const [food, setFood] = useState("");

  const continueToSurvey = () => {
    if (!nm.trim()) return;
    setName(nm.trim());
    setStep(2);
  };

  const finish = () => {
    const patch = {
      activity,
      hikes: hikes.trim(),
      wants: wants.trim(),
      bar_harbor: barHarbor.trim(),
      food: food.trim(),
    };
    if (Object.values(patch).some(Boolean)) upsertSurvey(patch);
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
      <div className="bg-pine relative overflow-hidden px-[18px] pt-[26px] pb-[22px]">
        <Topo />
        <div className="relative">
          <div className="font-mono text-[11px] tracking-[.12em] text-blaze uppercase mb-1.5">
            Hey {name.trim() || "there"}
          </div>
          <h1 className="font-display font-bold text-[26px] text-parchment m-0 leading-[1.1]">
            What do you want out of the weekend?
          </h1>
        </div>
      </div>
      <div className="max-w-[640px] mx-auto px-3.5 pt-4 pb-16 grid gap-5">
        <div className="font-mono text-[10.5px] text-mute">
          skip anything — answers land on the Ideas board
        </div>
        <Field label="Activity level">
          <Chips
            options={ACTIVITY_CHIPS}
            value={activity}
            onChange={(v) => setActivity(v === activity ? "" : v)}
          />
        </Field>
        <Field label="Hikes you have in mind">
          <Textarea
            rows={2}
            value={hikes}
            onChange={(e) => setHikes(e.target.value)}
            placeholder="Beehive, Precipice, something mellow…"
          />
        </Field>
        <Field label="What do you want to do?">
          <Textarea
            rows={2}
            value={wants}
            onChange={(e) => setWants(e.target.value)}
            placeholder="Swim, tide pools, sunrise, nothing at all…"
          />
        </Field>
        <Field label="Bar Harbor — anything specific?">
          <Textarea
            rows={2}
            value={barHarbor}
            onChange={(e) => setBarHarbor(e.target.value)}
            placeholder="A meal out, a shop, ice cream…"
          />
        </Field>
        <Field label="Food requests">
          <Textarea
            rows={2}
            value={food}
            onChange={(e) => setFood(e.target.value)}
            placeholder="Dishes you want, dietary stuff…"
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
