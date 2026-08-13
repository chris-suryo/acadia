"use client";

// The Ideas board: who's coming, and what each of them wants.
//
// This used to be a stack of full cards, one per person who'd answered — which
// meant two problems at once. Nine cards of prose was the longest wall of text
// in the app, and anyone who hadn't answered simply wasn't on it, so the one
// screen that should say "here's the group" couldn't answer "is everyone in?".
//
// Now the roster leads: every person on the trip is a face, whether or not
// they've opened the app, and their answers live one tap deep.

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Btn, Card, Input } from "./primitives";
import { Avatar } from "./ui/Avatar";
import { BottomSheet } from "./ui/BottomSheet";
import { Chips, MultiChips } from "./ui/Chips";
import { useOutside } from "./ui/useOutside";
import {
  EXPERIENCE_CHIPS,
  PACE_CHIPS,
  SURVEY_PLACEHOLDERS,
  VIBE_CHIPS,
  mergeSurvey,
  splitVibes,
  surveysByPerson,
} from "@/lib/survey";
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
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <Avatar userId={s.user_id} name={name} />
          <span className="text-[14.5px] font-semibold text-ink truncate">{name}</span>
        </span>
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
        <div className="font-mono text-[10.5px] text-moss mt-1 leading-[1.6]">
          {splitVibes(s.wants).join(" · ")}
        </div>
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
  const {
    surveys,
    profiles,
    userId,
    isMe,
    memberOf,
    members,
    memberAvatars,
    myMemberId,
    claimedMembers,
    name,
    upsertSurvey,
    ensureName,
  } = useData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TextDraft>({ food: "", hikes: "" });
  const [openPerson, setOpenPerson] = useState<string | null>(null);
  const [openVibe, setOpenVibe] = useState<string | null>(null);
  const editRef = useRef<HTMLDivElement | null>(null);

  // Everything you've answered, from whichever of your devices you answered it
  // on — so a vibe picked in Safari still shows in the installed app, and
  // editing here writes the whole merged answer back onto this device's row.
  const myRows = surveys.filter((s) => isMe(s.user_id) || s.user_id === userId);
  const mine = mergeSurvey(myRows);
  const vibes = splitVibes(mine?.wants ?? "");

  /**
   * Every person on the trip, with whatever they've said.
   *
   * Keyed off the roster rather than off the answers, because the people who
   * haven't answered are exactly the ones worth seeing: someone who joined and
   * skipped the questions looks identical to someone who never opened the app
   * if the only thing on screen is a list of answers.
   *
   * A row belongs to a device and iOS mints a second one per Home Screen
   * install, so answers are merged per person before they're looked up here.
   */
  const answerFor = new Map<string, SurveyRow>();
  for (const s of surveysByPerson(surveys, memberOf)) {
    const mid = memberOf(s.user_id);
    if (mid && answered(s)) answerFor.set(mid, s);
  }
  const crew = members.map((m) => ({
    member: m,
    answer: answerFor.get(m.id),
    joined: claimedMembers.includes(m.id),
    isYou: m.id === myMemberId,
  }));
  const joinedCount = crew.filter((c) => c.joined).length;
  const answeredCount = crew.filter((c) => c.answer).length;

  /**
   * What the group wants, counted per person.
   *
   * Every vibe is listed, including the ones nobody picked — "nobody wants
   * easy walks" is as useful for planning Saturday as the count at the top.
   */
  const wantRows = VIBE_CHIPS.map((vibe) => ({
    vibe,
    who: crew
      .filter((c) => c.answer && splitVibes(c.answer.wants).includes(vibe))
      .map((c) => c.member),
  })).sort((a, b) => b.who.length - a.who.length);
  const topWant = Math.max(1, ...wantRows.map((r) => r.who.length));
  const openWant = openVibe ? wantRows.find((r) => r.vibe === openVibe) : undefined;
  const open = openPerson ? crew.find((c) => c.member.id === openPerson) : undefined;

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
        // Nothing. Your own answer used to sit here as a full card of your own
        // prose, which is the one card on the page you already know the
        // contents of — it's your face in the roster below, and the sheet
        // there edits it.
        null
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

      {/* The aggregate, as something you can read at a glance. This was three
          words in a header — the top vibes, comma-joined — which said what led
          but never by how much, or who. */}
      {answeredCount > 0 && (
        <>
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="font-mono text-[10.5px] tracking-[.1em] uppercase text-granite">
              What everyone wants
            </span>
            <span className="font-mono text-[10.5px] text-mute">
              {answeredCount} answered
            </span>
          </div>
          {/* One line per vibe — label, bar, count — so six of them read as a
              chart you scan rather than a list you work through. */}
          <div className="grid gap-2.5 mb-1">
            {wantRows.map(({ vibe, who }) => (
              <button
                key={vibe}
                onClick={() => who.length && setOpenVibe(vibe)}
                aria-label={`${vibe} — ${who.length} ${who.length === 1 ? "person" : "people"}`}
                className="flex items-center gap-2.5 text-left bg-transparent border-none p-0 cursor-pointer"
              >
                <span className="w-[112px] shrink-0 truncate text-[12px] text-ink">
                  {vibe}
                </span>
                <span className="flex-1 h-[7px] bg-[#E6E0CE] rounded overflow-hidden">
                  <span
                    className="block h-full bg-moss transition-[width] duration-[250ms]"
                    style={{ width: `${(who.length / topWant) * 100}%` }}
                  />
                </span>
                <span className="w-3 shrink-0 text-right font-mono text-[11px] text-granite tabular-nums">
                  {who.length}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Everyone, faces first. A person who hasn't opened the app is dimmed
          rather than absent — the gap is the useful part. */}
      <div className="flex items-baseline justify-between mb-2 mt-6">
        <span className="font-mono text-[10.5px] tracking-[.1em] uppercase text-granite">
          Who&apos;s coming
        </span>
        {/* One line instead of twelve marks. A dot under each face needed a
            legend to mean anything, which is the noise this row replaced. */}
        <span className="font-mono text-[10.5px] text-blaze">
          {joinedCount} of {crew.length} in · {answeredCount} answered
        </span>
      </div>
      <div className="grid grid-cols-4 gap-x-1 gap-y-3 mb-1">
        {crew.map(({ member, answer, joined, isYou }) => (
          <button
            key={member.id}
            onClick={() => setOpenPerson(member.id)}
            aria-label={`${member.name}${isYou ? " (you)" : ""}${
              answer ? "" : " — hasn't weighed in"
            }`}
            className={`flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-1 ${
              joined ? "" : "opacity-40"
            }`}
          >
            <Avatar
              userId={member.id}
              url={memberAvatars[member.id]}
              name={member.name}
              size={44}
            />
            <span className="max-w-full truncate text-[11.5px] text-ink">
              {member.name.split(" ")[0]}
              {isYou ? " (you)" : ""}
            </span>
          </button>
        ))}
      </div>

      <BottomSheet open={!!open} onClose={() => setOpenPerson(null)}>
        {open && (
          <>
            {open.answer ? (
              <CardBody
                s={open.answer}
                name={profiles[open.answer.user_id]?.trim() || open.member.name}
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <Avatar
                  userId={open.member.id}
                  url={memberAvatars[open.member.id]}
                  name={open.member.name}
                  size={32}
                />
                <div>
                  <div className="text-[14.5px] font-semibold text-ink">
                    {open.member.name}
                  </div>
                  <div className="font-mono text-[11px] text-mute mt-0.5">
                    {open.joined
                      ? "hasn't answered the questions yet"
                      : "hasn't opened the app yet"}
                  </div>
                </div>
              </div>
            )}
            {open.isYou && (
              <div className="mt-4 flex justify-end">
                <Btn
                  small
                  onClick={() => {
                    setOpenPerson(null);
                    ensureName(startEdit);
                  }}
                >
                  Edit yours
                </Btn>
              </div>
            )}
          </>
        )}
      </BottomSheet>

      {/* "Seven want swimming" is a fact; "which seven" is what you act on. */}
      <BottomSheet open={!!openWant} onClose={() => setOpenVibe(null)}>
        {openWant && (
          <>
            <div className="font-mono text-[10.5px] tracking-[.1em] uppercase text-granite mb-3">
              {openWant.vibe} · {openWant.who.length}
            </div>
            <div className="grid gap-3">
              {openWant.who.map((m) => (
                <span key={m.id} className="flex items-center gap-2.5">
                  <Avatar
                    userId={m.id}
                    url={memberAvatars[m.id]}
                    name={m.name}
                    size={28}
                  />
                  <span className="text-[14px] font-medium text-ink">{m.name}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </BottomSheet>
    </>
  );
}
