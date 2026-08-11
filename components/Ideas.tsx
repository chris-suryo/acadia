"use client";

// The Ideas board: everyone's questionnaire answers as cards. Your own card
// is the tap target — edits happen inline and save on tap-away, same grammar
// as the schedule entries. Others' cards are read-only.

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Btn, Card, Textarea } from "./primitives";
import { Chips } from "./ui/Chips";
import { useOutside } from "./ui/useOutside";
import { ACTIVITY_CHIPS, SURVEY_PLACEHOLDERS } from "./Welcome";
import { useData } from "@/lib/data/context";
import type { SurveyRow } from "@/lib/types";

const TEXT_FIELDS = [
  { key: "hikes", label: "hikes" },
  { key: "wants", label: "want to do" },
  { key: "bar_harbor", label: "bar harbor" },
  { key: "food", label: "food requests" },
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
        {s.activity && (
          <span className="font-mono text-[10.5px] text-blaze uppercase tracking-[.07em] shrink-0">
            {s.activity}
          </span>
        )}
      </div>
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
  const [draft, setDraft] = useState<TextDraft>({
    hikes: "",
    wants: "",
    bar_harbor: "",
    food: "",
  });
  const editRef = useRef<HTMLDivElement | null>(null);

  const mine = surveys.find((s) => s.user_id === userId);
  const others = surveys
    .filter((s) => s.user_id !== userId && answered(s))
    .sort((a, b) =>
      (profiles[a.user_id] || "").localeCompare(profiles[b.user_id] || ""),
    );

  const startEdit = () => {
    setDraft({
      hikes: mine?.hikes ?? "",
      wants: mine?.wants ?? "",
      bar_harbor: mine?.bar_harbor ?? "",
      food: mine?.food ?? "",
    });
    setEditing(true);
  };

  const commit = () => {
    const patch: TextDraft = {
      hikes: draft.hikes.trim(),
      wants: draft.wants.trim(),
      bar_harbor: draft.bar_harbor.trim(),
      food: draft.food.trim(),
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
                  activity level
                </div>
                <Chips
                  options={ACTIVITY_CHIPS}
                  value={mine?.activity ?? ""}
                  onChange={(v) =>
                    upsertSurvey({ activity: v === mine?.activity ? "" : v })
                  }
                />
              </div>
              {TEXT_FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="font-mono text-[10px] tracking-[.1em] uppercase text-mute mb-1.5">
                    {f.label}
                  </div>
                  <Textarea
                    rows={2}
                    value={draft[f.key]}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    placeholder={SURVEY_PLACEHOLDERS[f.key]}
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
              activity · hikes · bar harbor · food
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
