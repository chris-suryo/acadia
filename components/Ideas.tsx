"use client";

// The Ideas board: everyone's questionnaire answers as cards. Your own card
// edits inline with the same chips as the intro — chip taps save instantly,
// the two type-ins save on Done or tap-away. Others' cards are read-only.

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Btn, Card, Input } from "./primitives";
import { Chips, MultiChips } from "./ui/Chips";
import { useOutside } from "./ui/useOutside";
import {
  EXPERIENCE_CHIPS,
  PACE_CHIPS,
  SURVEY_PLACEHOLDERS,
  VIBE_CHIPS,
  splitVibes,
} from "./Welcome";
import { useData } from "@/lib/data/context";
import type { SurveyRow } from "@/lib/types";

// Text fields on the card (survey columns predate the shape: hikes holds the
// anything-else line).
const TEXT_FIELDS = [
  { key: "food", label: "food requests", placeholder: SURVEY_PLACEHOLDERS.food },
  { key: "hikes", label: "anything else", placeholder: SURVEY_PLACEHOLDERS.extra },
] as const;

type TextKey = (typeof TEXT_FIELDS)[number]["key"];
type TextDraft = Record<TextKey, string>;

const answered = (s: SurveyRow) =>
  !!(s.activity || s.hikes || s.wants || s.bar_harbor || s.food);

function CardBody({ s, name }: { s: SurveyRow; name: string }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[14.5px] font-semibold text-ink">{name}</span>
        <span className="flex items-baseline gap-2 shrink-0">
          {s.bar_harbor && (
            <span className="font-mono text-[10px] text-mute uppercase tracking-[.07em]">
              {s.bar_harbor}
            </span>
          )}
          {s.activity && (
            <span className="font-mono text-[10.5px] text-blaze uppercase tracking-[.07em]">
              {s.activity}
            </span>
          )}
        </span>
      </div>
      {s.wants && (
        <div className="font-mono text-[10.5px] text-moss mt-1">{s.wants}</div>
      )}
      {TEXT_FIELDS.filter((f) => s[f.key]).map((f) => (
        <div key={f.key} className="mt-2">
          <div className="font-mono text-[10px] tracking-[.1em] uppercase text-mute">
            {f.label}
          </div>
          <div className="text-[13.5px] text-ink leading-[1.5] mt-0.5">{s[f.key]}</div>
        </div>
      ))}
    </>
  );
}

export function Ideas() {
  const { surveys, profiles, userId, name, upsertSurvey, ensureName } = useData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TextDraft>({ food: "", hikes: "" });
  const editRef = useRef<HTMLDivElement | null>(null);

  const mine = surveys.find((s) => s.user_id === userId);
  const vibes = splitVibes(mine?.wants ?? "");
  const others = surveys
    .filter((s) => s.user_id !== userId && answered(s))
    .sort((a, b) =>
      (profiles[a.user_id] || "").localeCompare(profiles[b.user_id] || ""),
    );

  const startEdit = () => {
    setDraft({ food: mine?.food ?? "", hikes: mine?.hikes ?? "" });
    setEditing(true);
  };

  const commit = () => {
    const patch: TextDraft = {
      food: draft.food.trim(),
      hikes: draft.hikes.trim(),
    };
    if (TEXT_FIELDS.some((f) => patch[f.key] !== (mine?.[f.key] ?? "")))
      upsertSurvey(patch);
    setEditing(false);
  };

  useOutside(editing, editRef, commit);

  const myName = name.trim() || "You";

  return (
    <>
      {editing ? (
        <div ref={editRef} className="mb-3">
          <Card className="overflow-hidden">
            <div className="px-3.5 py-3 bg-[#FBF8EE] grid gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[14.5px] font-semibold text-ink">{myName}</span>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[.1em] uppercase text-mute mb-1.5">
                  pick what sounds good
                </div>
                <MultiChips
                  options={VIBE_CHIPS}
                  values={vibes}
                  onToggle={(v) => {
                    const next = vibes.includes(v)
                      ? vibes.filter((x) => x !== v)
                      : [...vibes, v];
                    upsertSurvey({ wants: next.join(" · ") });
                  }}
                />
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[.1em] uppercase text-mute mb-1.5">
                  saturday pace
                </div>
                <Chips
                  options={PACE_CHIPS}
                  value={mine?.activity ?? ""}
                  onChange={(v) =>
                    upsertSurvey({ activity: v === mine?.activity ? "" : v })
                  }
                />
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[.1em] uppercase text-mute mb-1.5">
                  camped before?
                </div>
                <Chips
                  options={EXPERIENCE_CHIPS}
                  value={mine?.bar_harbor ?? ""}
                  onChange={(v) =>
                    upsertSurvey({ bar_harbor: v === mine?.bar_harbor ? "" : v })
                  }
                />
              </div>
              {TEXT_FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="font-mono text-[10px] tracking-[.1em] uppercase text-mute mb-1.5">
                    {f.label}
                  </div>
                  <Input
                    value={draft[f.key]}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="min-h-[42px] p-2.5"
                  />
                </div>
              ))}
              <div className="flex justify-end">
                <Btn small onClick={commit}>
                  Done
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      ) : mine && answered(mine) ? (
        <button
          onClick={startEdit}
          className="block w-full text-left bg-transparent border-none p-0 cursor-pointer mb-3"
        >
          <Card className="px-3.5 py-3">
            <CardBody s={mine} name={myName} />
          </Card>
        </button>
      ) : (
        <Card className="overflow-hidden mb-3">
          <button
            onClick={() => ensureName(startEdit)}
            className="w-full text-left bg-transparent border-none cursor-pointer px-3.5 py-[11px] min-h-[44px]"
          >
            <span className="flex items-center gap-1.5 text-granite text-[13px]">
              <Plus size={14} /> Add yours
            </span>
            <span className="block font-mono text-[10.5px] text-mute mt-0.5 ml-[22px]">
              the weekend you want · pace · food
            </span>
          </button>
        </Card>
      )}

      {others.map((s) => (
        <Card key={s.user_id} className="px-3.5 py-3 mb-3">
          <CardBody s={s} name={profiles[s.user_id]?.trim() || "Someone"} />
        </Card>
      ))}

      {others.length === 0 && (
        <div className="p-5 text-[13.5px] text-mute text-center">
          Nobody else has weighed in yet.
        </div>
      )}
    </>
  );
}
