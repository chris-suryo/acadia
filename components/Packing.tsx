"use client";

import { Lock } from "lucide-react";
import { Box, Card, Segmented, SubH } from "./primitives";
import { AddRow } from "./ui/AddRow";
import { SwipeRow } from "./ui/SwipeRow";
import { useUi } from "./ui/UiProvider";
import { useData } from "@/lib/data/context";
import { GEAR_CATEGORIES, PERSONAL_CATEGORIES } from "@/lib/seeds";
import type { GearItem, PersonalItem } from "@/lib/types";

function orderedCats(canonical: string[], present: string[]): string[] {
  const extras = present.filter((c) => !canonical.includes(c));
  return [...canonical.filter((c) => present.includes(c)), ...extras];
}

// One level deep: parents in sort order, each followed by its children.
function tree<T extends { id: string; parent_id: string | null; sort: number }>(
  rows: T[],
): { item: T; child: boolean }[] {
  const out: { item: T; child: boolean }[] = [];
  for (const p of rows.filter((r) => !r.parent_id).sort((a, b) => a.sort - b.sort)) {
    out.push({ item: p, child: false });
    for (const c of rows
      .filter((r) => r.parent_id === p.id)
      .sort((a, b) => a.sort - b.sort)) {
      out.push({ item: c, child: true });
    }
  }
  return out;
}

export function Packing({
  view,
  setView,
}: {
  view: string;
  setView: (v: string) => void;
}) {
  const {
    gear,
    personal,
    profiles,
    toggleClaimGear,
    addGear,
    deleteGear,
    restoreGear,
    togglePersonal,
    addPersonal,
    deletePersonal,
    restorePersonal,
    ensureName,
  } = useData();
  const { showUndo } = useUi();

  const gCats = orderedCats(GEAR_CATEGORIES, [...new Set(gear.map((i) => i.category))]);
  const mCats = orderedCats(PERSONAL_CATEGORIES, [...new Set(personal.map((i) => i.category))]);
  const unclaimed = gear.filter((i) => !i.owner_id).length;
  const done = personal.filter((i) => i.checked).length;
  const pct = personal.length ? Math.round((done / personal.length) * 100) : 0;

  const claim = (id: string) => {
    const it = gear.find((i) => i.id === id);
    if (!it) return;
    if (!it.owner_id) ensureName(() => toggleClaimGear(id));
    else toggleClaimGear(id);
  };

  const gearRow = (i: GearItem, child: boolean) => (
    <SwipeRow
      key={i.id}
      className="border-b border-rule"
      onDelete={() => {
        const snap = { ...i };
        const kids = child ? [] : gear.filter((g) => g.parent_id === i.id).map((g) => ({ ...g }));
        deleteGear(i.id);
        showUndo("Deleted", () => restoreGear(snap, kids));
      }}
    >
      <button
        onClick={() => claim(i.id)}
        className={`w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-[11px] py-3 pr-3.5 ${
          child ? "pl-12" : "pl-3.5"
        }`}
      >
        <Box on={!!i.owner_id} />
        <span className="flex-1 min-w-0">
          <span className="block text-[14.5px] text-ink leading-[1.35]">{i.label}</span>
          <span
            className={`block font-mono text-[10.5px] mt-0.5 ${
              i.owner_id ? "text-moss" : "text-mute"
            }`}
          >
            {i.owner_id ? profiles[i.owner_id]?.trim() || "Claimed" : "Unclaimed"}
          </span>
        </span>
      </button>
    </SwipeRow>
  );

  const personalRow = (i: PersonalItem, child: boolean) => (
    <SwipeRow
      key={i.id}
      className="border-b border-rule"
      onDelete={() => {
        const snap = { ...i };
        const kids = child
          ? []
          : personal.filter((p) => p.parent_id === i.id).map((p) => ({ ...p }));
        deletePersonal(i.id);
        showUndo("Deleted", () => restorePersonal(snap, kids));
      }}
    >
      <button
        onClick={() => togglePersonal(i.id)}
        className={`w-full text-left bg-transparent border-none cursor-pointer flex items-start gap-[11px] py-3 pr-3.5 ${
          child ? "pl-12" : "pl-3.5"
        }`}
      >
        <Box on={i.checked} />
        <span className="flex-1 min-w-0 pt-0.5">
          <span
            className={`block text-[14.5px] text-ink leading-[1.35] ${
              i.checked ? "line-through opacity-50" : ""
            }`}
          >
            {i.label}
          </span>
          {i.note && (
            <span className="block text-[11.5px] text-mute mt-0.5 leading-[1.4]">
              {i.note}
            </span>
          )}
        </span>
      </button>
    </SwipeRow>
  );

  return (
    <div className="px-3.5 pt-4 pb-[60px]">
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { id: "group", label: "Group gear" },
          { id: "mine", label: "My list" },
        ]}
      />

      {view === "group" ? (
        <>
          {gCats.map((cat, ci) => {
            const rows = gear.filter((i) => i.category === cat);
            return (
              <div key={cat} className="mb-5">
                <SubH
                  right={ci === 0 && unclaimed > 0 ? `${unclaimed} unclaimed` : null}
                >
                  {cat}
                </SubH>
                <Card className="overflow-hidden">
                  {tree(rows).map(({ item, child }) => gearRow(item, child))}
                  <AddRow label="Add" placeholder="Item" onAdd={(t) => addGear(cat, t)} />
                </Card>
              </div>
            );
          })}
        </>
      ) : (
        <>
          <div className="mb-[18px]">
            <div className="h-[7px] bg-[#E6E0CE] rounded overflow-hidden">
              <div
                className="h-full bg-moss transition-[width] duration-[250ms]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-mono text-[11px] text-granite">
                {done} of {personal.length} packed
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-mute">
                <Lock size={11} /> only visible to you
              </span>
            </div>
          </div>

          {mCats.map((cat) => {
            const rows = personal.filter((i) => i.category === cat);
            return (
              <div key={cat} className="mb-5">
                <SubH>{cat}</SubH>
                <Card className="overflow-hidden">
                  {tree(rows).map(({ item, child }) => personalRow(item, child))}
                  <AddRow
                    label="Add"
                    placeholder="Item"
                    onAdd={(t) => addPersonal(cat, t)}
                  />
                </Card>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
