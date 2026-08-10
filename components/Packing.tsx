"use client";

import { useState } from "react";
import { Lock, Plus } from "lucide-react";
import { Box, Btn, Card, Input, Kill, Segmented, Select, SubH } from "./primitives";
import { useData } from "@/lib/data/context";
import { GEAR_CATEGORIES, PERSONAL_CATEGORIES } from "@/lib/seeds";

function orderedCats(canonical: string[], present: string[]): string[] {
  const extras = present.filter((c) => !canonical.includes(c));
  return [...canonical.filter((c) => present.includes(c)), ...extras];
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
    togglePersonal,
    addPersonal,
    deletePersonal,
    requireName,
  } = useData();

  const [gTxt, setGTxt] = useState("");
  const [gCat, setGCat] = useState("Camp Kitchen");
  const [mTxt, setMTxt] = useState("");
  const [mCat, setMCat] = useState("Essentials");

  const gCats = orderedCats(GEAR_CATEGORIES, [...new Set(gear.map((i) => i.category))]);
  const mCats = orderedCats(PERSONAL_CATEGORIES, [...new Set(personal.map((i) => i.category))]);
  const unclaimed = gear.filter((i) => !i.owner_id).length;
  const done = personal.filter((i) => i.checked).length;
  const pct = personal.length ? Math.round((done / personal.length) * 100) : 0;

  const claim = (id: string) => {
    const it = gear.find((i) => i.id === id);
    if (!it) return;
    if (!it.owner_id && !requireName()) return;
    toggleClaimGear(id);
  };

  const addGroup = () => {
    if (!gTxt.trim()) return;
    addGear(gCat, gTxt.trim());
    setGTxt("");
  };

  const addMine = () => {
    if (!mTxt.trim()) return;
    addPersonal(mCat, mTxt.trim());
    setMTxt("");
  };

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
            const rows = gear
              .filter((i) => i.category === cat)
              .sort((a, b) => a.sort - b.sort);
            return (
              <div key={cat} className="mb-5">
                <SubH
                  right={ci === 0 && unclaimed > 0 ? `${unclaimed} unclaimed` : null}
                >
                  {cat}
                </SubH>
                <Card>
                  {rows.map((i, idx) => (
                    <div
                      key={i.id}
                      className={`flex items-center gap-[11px] pl-3.5 pr-2 py-3 ${
                        idx < rows.length - 1 ? "border-b border-rule" : ""
                      }`}
                    >
                      <Box on={!!i.owner_id} onClick={() => claim(i.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14.5px] text-ink leading-[1.35]">
                          {i.label}
                        </div>
                        <div
                          className={`font-mono text-[10.5px] mt-0.5 ${
                            i.owner_id ? "text-moss" : "text-mute"
                          }`}
                        >
                          {i.owner_id
                            ? profiles[i.owner_id]?.trim() || "Claimed"
                            : "Unclaimed"}
                        </div>
                      </div>
                      <Kill onClick={() => deleteGear(i.id)} />
                    </div>
                  ))}
                </Card>
              </div>
            );
          })}

          <Card className="p-3.5">
            <SubH>Add an item</SubH>
            <div className="grid gap-2">
              <Input
                value={gTxt}
                onChange={(e) => setGTxt(e.target.value)}
                placeholder="Item"
              />
              <div className="flex gap-2">
                <Select
                  value={gCat}
                  onChange={(e) => setGCat(e.target.value)}
                  className="flex-1"
                >
                  {gCats.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
                <Btn onClick={addGroup}>
                  <Plus size={15} /> Add
                </Btn>
              </div>
            </div>
          </Card>
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
            const rows = personal
              .filter((i) => i.category === cat)
              .sort((a, b) => a.sort - b.sort);
            return (
              <div key={cat} className="mb-5">
                <SubH>{cat}</SubH>
                <Card>
                  {rows.map((i, idx) => (
                    <div
                      key={i.id}
                      className={`flex items-start gap-[11px] pl-3.5 pr-2 py-3 ${
                        idx < rows.length - 1 ? "border-b border-rule" : ""
                      }`}
                    >
                      <Box on={i.checked} onClick={() => togglePersonal(i.id)} />
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div
                          className={`text-[14.5px] text-ink leading-[1.35] ${
                            i.checked ? "line-through opacity-50" : ""
                          }`}
                        >
                          {i.label}
                        </div>
                        {i.note && (
                          <div className="text-[11.5px] text-mute mt-0.5 leading-[1.4]">
                            {i.note}
                          </div>
                        )}
                      </div>
                      <Kill onClick={() => deletePersonal(i.id)} />
                    </div>
                  ))}
                </Card>
              </div>
            );
          })}

          <Card className="p-3.5">
            <SubH>Add an item</SubH>
            <div className="grid gap-2">
              <Input
                value={mTxt}
                onChange={(e) => setMTxt(e.target.value)}
                placeholder="Item"
              />
              <div className="flex gap-2">
                <Select
                  value={mCat}
                  onChange={(e) => setMCat(e.target.value)}
                  className="flex-1"
                >
                  {mCats.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
                <Btn onClick={addMine}>
                  <Plus size={15} /> Add
                </Btn>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
