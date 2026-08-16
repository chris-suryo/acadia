"use client";

import { Check, X } from "lucide-react";
import { AddRow } from "./AddRow";
import { BottomSheet } from "./BottomSheet";
import { Avatar } from "./Avatar";
import { Btn } from "@/components/primitives";
import { useData } from "@/lib/data/context";
import type { Member } from "@/lib/types";

/**
 * "Who was this for?"
 *
 * A sheet rather than chips inline, because at twelve people the chips are four
 * rows of pills above everything else in the form. The two shortcuts sit at the
 * top as their own buttons — the earlier version toggled a single label between
 * "everyone" and "none", which read as the opposite of what it did once
 * everybody was already selected.
 */
export function PeoplePicker({
  open,
  onClose,
  members,
  selected,
  onChange,
  solo,
}: {
  open: boolean;
  onClose: () => void;
  members: Member[];
  selected: string[];
  onChange: (ids: string[]) => void;
  /** The one-person shortcut — whoever paid, named so it's obvious who it means. */
  solo: { id: string; label: string };
}) {
  const { memberAvatars, splitGroups, addSplitGroup, deleteSplitGroup } = useData();
  const all = members.map((m) => m.id);
  const saved = splitGroups.map((g) => ({
    ...g,
    // A group can outlive a member leaving the roster; re-adding them by
    // applying an old group would be a surprise, so it's filtered to the
    // people who are actually here.
    member_ids: g.member_ids.filter((id) => all.includes(id)),
  }));
  const isSameSet = (a: string[], b: string[]) =>
    a.length === b.length && a.every((x) => b.includes(x));
  const isEveryone = selected.length === members.length && members.length > 0;
  const isSolo = selected.length === 1 && selected[0] === solo.id;

  const shortcut = (on: boolean) =>
    `flex-1 px-3 py-2 min-h-[40px] rounded-full border cursor-pointer font-mono text-[11px] uppercase tracking-[.07em] ${
      on ? "border-blaze text-blaze bg-[#FBEFE4]" : "border-rule text-granite bg-transparent"
    }`;

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="grid gap-3">
        <div className="font-mono text-[10.5px] tracking-[.1em] uppercase text-granite">
          Split between
        </div>
        <div className="flex gap-2">
          <button onClick={() => onChange(all)} aria-pressed={isEveryone} className={shortcut(isEveryone)}>
            Everyone
          </button>
          <button
            onClick={() => onChange(solo.id ? [solo.id] : [])}
            aria-pressed={isSolo}
            disabled={!solo.id}
            className={`${shortcut(isSolo)} disabled:opacity-40`}
          >
            {solo.label}
          </button>
        </div>
        {/* Gas and parking were split twelve ways because twelve ways was the
            easy answer. A car is the same four people every time — name it
            once and it's a tap. */}
        {saved.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {saved.map((g) => {
              const on = isSameSet(g.member_ids, selected);
              return (
                <span
                  key={g.id}
                  className={`flex items-center rounded-full border ${
                    on ? "border-blaze bg-[#FBEFE4]" : "border-rule"
                  }`}
                >
                  <button
                    onClick={() => onChange(g.member_ids)}
                    aria-pressed={on}
                    className={`bg-transparent border-none cursor-pointer pl-3 pr-1.5 py-1.5 min-h-[36px] text-[12.5px] ${
                      on ? "text-ink" : "text-granite"
                    }`}
                  >
                    {g.label}
                    <span className="font-mono text-[10.5px] text-mute"> · {g.member_ids.length}</span>
                  </button>
                  <button
                    onClick={() => deleteSplitGroup(g.id)}
                    aria-label={`Delete the ${g.label} group`}
                    className="bg-transparent border-none cursor-pointer text-mute pl-0.5 pr-2.5 py-1.5 min-h-[36px]"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Only worth offering for a real subset: "everyone" already has a
            button, and one person is the solo shortcut. */}
        {selected.length > 1 &&
          !isEveryone &&
          !saved.some((g) => isSameSet(g.member_ids, selected)) && (
            <div className="border border-rule rounded-lg -my-0.5">
              <AddRow
                label={`Save these ${selected.length} as a group`}
                placeholder="Name it — Chris's car"
                onAdd={(t) => addSplitGroup(t, selected)}
              />
            </div>
          )}

        {/* Capped so a long roster scrolls inside the sheet instead of pushing
            Done off the bottom of the screen. */}
        <div className="max-h-[46vh] overflow-y-auto -mx-1 px-1">
          {members.map((m) => {
            const on = selected.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() =>
                  onChange(on ? selected.filter((x) => x !== m.id) : [...selected, m.id])
                }
                aria-label={`${on ? "Leave out" : "Include"} ${m.name}`}
                aria-pressed={on}
                className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-2.5 py-2.5 border-b border-rule last:border-b-0"
              >
                <Avatar userId={m.id} url={memberAvatars[m.id]} name={m.name} size={28} />
                <span className={`flex-1 min-w-0 text-[15px] truncate ${on ? "text-ink" : "text-mute"}`}>
                  {m.name}
                </span>
                <span
                  aria-hidden
                  className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center shrink-0 ${
                    on ? "bg-moss border-moss" : "border-[#B7BEAE]"
                  }`}
                >
                  {on && <Check size={13} color="#fff" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
        <Btn onClick={onClose} full>
          Done
        </Btn>
      </div>
    </BottomSheet>
  );
}

/**
 * "Everyone", "Chris's car", "Alana", or "Alana, Erin +2".
 *
 * A named group wins when it matches exactly: "split 4 ways" tells you the
 * arithmetic, "Chris's car" tells you whether you should be in it.
 */
export function splitLabel(
  members: Member[],
  selected: string[],
  groups: { label: string; member_ids: string[] }[] = [],
): string {
  if (selected.length === 0) return "Nobody yet";
  if (members.length > 0 && selected.length === members.length) return "Everyone";
  const named = groups.find(
    (g) =>
      g.member_ids.length === selected.length &&
      g.member_ids.every((x) => selected.includes(x)),
  );
  if (named) return named.label;
  const names = members.filter((m) => selected.includes(m.id)).map((m) => m.name);
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}
