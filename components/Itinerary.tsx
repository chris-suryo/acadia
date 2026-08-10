"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Cloud,
  CloudRain,
  CloudSun,
  Pencil,
  Plus,
  Sun,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Btn, Card, Input, Kill } from "./primitives";
import { useData, type DraftBlock } from "@/lib/data/context";

function weatherIcon(condition: string): LucideIcon {
  const c = condition.toLowerCase();
  if (c.includes("thunder")) return Zap;
  if (/partly|mostly sunny|mostly clear/.test(c)) return CloudSun;
  if (/rain|shower|drizzle/.test(c)) return CloudRain;
  if (/sunny|clear/.test(c)) return Sun;
  if (/fog|cloud|overcast/.test(c)) return Cloud;
  return CloudSun;
}

export function Itinerary({ jump }: { jump: (slug: string) => void }) {
  const { days, blocks, weather, saveDayBlocks } = useData();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<(DraftBlock & { key: string })[]>([]);

  const sortedDays = [...days].sort((a, b) => a.sort - b.sort);

  const startEdit = (dayId: string) => {
    const rows = blocks
      .filter((b) => b.day_id === dayId)
      .sort((a, b) => a.sort - b.sort)
      .map((b) => ({
        key: b.id,
        id: b.id,
        time_label: b.time_label,
        body: b.body,
        link_slug: b.link_slug,
      }));
    setEditing(dayId);
    setDraft(rows);
  };

  const commit = (dayId: string) => {
    saveDayBlocks(dayId, draft);
    setEditing(null);
    setDraft([]);
  };

  const cancel = () => {
    setEditing(null);
    setDraft([]);
  };

  return (
    <div className="px-3.5 pt-4 pb-[60px]">
      {sortedDays.map((d) => {
        const w = weather[d.id];
        const WIcon = w ? weatherIcon(w.condition) : null;
        const isEd = editing === d.id;
        const dayBlocks = blocks
          .filter((b) => b.day_id === d.id)
          .sort((a, b) => a.sort - b.sort);
        return (
          <div key={d.id} className="mb-[26px]">
            <div className="flex justify-between items-end gap-2.5 mb-1">
              <div>
                <div className="font-mono text-[10px] tracking-[.12em] uppercase text-blaze">
                  {d.subtitle}
                </div>
                <h3 className="font-display font-bold text-[19px] text-ink mt-[3px] mb-0 leading-[1.15]">
                  {d.day_label}{" "}
                  <span className="text-mute font-semibold">· {d.date_label}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {w && WIcon && (
                  <div className="flex items-center gap-1.5">
                    <WIcon size={17} className="text-granite" />
                    <span className="font-mono text-[13px] text-ink font-medium">
                      {w.high}° / {w.low}°
                    </span>
                  </div>
                )}
                {!isEd && (
                  <button
                    onClick={() => startEdit(d.id)}
                    aria-label={`Edit ${d.day_label}`}
                    className="bg-transparent border-none cursor-pointer p-[5px] text-mute flex"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>
            </div>
            {w && (
              <div className="text-[11.5px] text-mute mb-2">{w.condition}</div>
            )}

            {!isEd ? (
              <Card className="overflow-hidden">
                {dayBlocks.map((b, i) => (
                  <div
                    key={b.id}
                    className={`flex gap-3 px-3.5 py-[13px] ${
                      i < dayBlocks.length - 1 ? "border-b border-rule" : ""
                    }`}
                  >
                    <div className="font-mono text-[9.5px] text-blaze uppercase tracking-[.07em] w-[58px] shrink-0 pt-[3px]">
                      {b.time_label}
                    </div>
                    <div className="text-[14px] text-ink leading-normal">
                      {b.body}
                      {b.link_slug && (
                        <button
                          onClick={() => jump(b.link_slug!)}
                          className="inline-flex items-center gap-[3px] ml-1.5 p-0 bg-transparent border-none cursor-pointer text-blaze text-[12.5px] font-semibold"
                        >
                          details <ArrowUpRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            ) : (
              <Card className="p-3">
                <div className="grid gap-2.5">
                  {draft.map((b, i) => (
                    <div key={b.key} className="flex gap-2 items-start">
                      <Input
                        value={b.time_label}
                        onChange={(e) => {
                          const nd = [...draft];
                          nd[i] = { ...nd[i], time_label: e.target.value };
                          setDraft(nd);
                        }}
                        className="w-[92px] shrink-0 text-[13px] min-h-[42px] px-2 py-2.5"
                      />
                      <textarea
                        value={b.body}
                        onChange={(e) => {
                          const nd = [...draft];
                          nd[i] = { ...nd[i], body: e.target.value };
                          setDraft(nd);
                        }}
                        rows={2}
                        className="flex-1 p-2.5 rounded-lg border border-rule bg-white text-[14px] text-ink resize-y"
                      />
                      <Kill
                        onClick={() =>
                          setDraft(draft.filter((x) => x.key !== b.key))
                        }
                      />
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setDraft([
                        ...draft,
                        {
                          key: `new-${Date.now()}-${draft.length}`,
                          time_label: "",
                          body: "",
                          link_slug: null,
                        },
                      ])
                    }
                    className="flex items-center gap-1.5 bg-transparent border border-dashed border-rule rounded-lg p-2.5 cursor-pointer text-granite text-[13px] justify-center"
                  >
                    <Plus size={14} /> Add a block
                  </button>
                  <div className="flex gap-2 justify-end">
                    <Btn small tone="granite" onClick={cancel}>
                      <X size={13} /> Cancel
                    </Btn>
                    <Btn small onClick={() => commit(d.id)}>
                      <Check size={13} /> Save
                    </Btn>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
