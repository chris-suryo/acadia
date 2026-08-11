"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Cloud,
  CloudRain,
  CloudSun,
  GripVertical,
  Sun,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, SubH } from "./primitives";
import { Ideas } from "./Ideas";
import { MapOverlay, useMapPrefetch } from "./MapLightbox";
import { splitVibes } from "./Welcome";
import { TRIP_DATES } from "@/lib/config";
import { SPOTS } from "@/lib/content";
import { AddRow } from "./ui/AddRow";
import { focusCenter } from "./ui/focusCenter";
import { Chips } from "./ui/Chips";
import { useUi } from "./ui/UiProvider";
import { useData, type BlockPatch } from "@/lib/data/context";
import type { DayPart, ItineraryBlock } from "@/lib/types";

function weatherIcon(condition: string): LucideIcon {
  const c = condition.toLowerCase();
  if (c.includes("thunder")) return Zap;
  if (/partly|mostly sunny|mostly clear/.test(c)) return CloudSun;
  if (/rain|shower|drizzle/.test(c)) return CloudRain;
  if (/sunny|clear/.test(c)) return Sun;
  if (/fog|cloud|overcast/.test(c)) return Cloud;
  return CloudSun;
}

const PARTS: { value: DayPart | null; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: null, label: "—" },
];

const PART_ORDER: (DayPart | null)[] = [null, "morning", "afternoon", "evening"];
const SPOT_BY_ID = new Map(SPOTS.map((s) => [s.id, s]));
const PART_LABEL: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

function flatOrder(dayBlocks: ItineraryBlock[]): ItineraryBlock[] {
  return PART_ORDER.flatMap((p) =>
    dayBlocks.filter((b) => b.day_part === p).sort((a, b) => a.sort - b.sort),
  );
}

type Draft = { title: string; detail: string };

function Entry({
  block,
  isExpanded,
  onExpand,
  onCollapse,
  draft,
  setDraft,
  expandedRef,
  jump,
}: {
  block: ItineraryBlock;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  draft: Draft;
  setDraft: (d: Draft) => void;
  expandedRef: React.RefObject<HTMLDivElement | null>;
  jump: (slug: string) => void;
}) {
  const { updateBlock, deleteBlock, restoreBlock } = useData();
  const { showUndo } = useUi();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Linked entries carry their spot's photo — Explore's imagery in the plan.
  const spotPhoto = block.link_slug
    ? SPOT_BY_ID.get(block.link_slug)?.photo
    : undefined;

  if (!isExpanded) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onExpand}
        className={`flex items-center gap-3 px-3.5 py-[11px] cursor-pointer ${isDragging ? "opacity-60" : ""}`}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-ink leading-[1.35]">
            {block.title}
          </div>
          {(block.detail || block.link_slug) && (
            <div className="text-[12px] text-mute mt-0.5 leading-[1.45]">
              {block.detail}
              {block.link_slug && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    jump(block.link_slug!);
                  }}
                  className="inline-flex items-center gap-[3px] ml-1.5 p-0 bg-transparent border-none cursor-pointer text-blaze text-[12px] font-semibold"
                >
                  details <ArrowUpRight size={11} />
                </button>
              )}
            </div>
          )}
        </div>
        {spotPhoto && (
          // eslint-disable-next-line @next/next/no-img-element -- storage-hosted thumb
          <img
            src={spotPhoto.src}
            alt=""
            loading="lazy"
            className="w-11 h-11 rounded-lg object-cover border border-rule shrink-0"
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        expandedRef.current = el;
      }}
      style={style}
      className="px-3.5 py-3 bg-[#FBF8EE]"
    >
      <div className="flex gap-2 items-start">
        <button
          {...attributes}
          {...listeners}
          aria-label="Reorder"
          className="bg-transparent border-none p-1 mt-2 text-mute cursor-grab touch-none shrink-0"
        >
          <GripVertical size={15} />
        </button>
        <div className="flex-1 grid gap-2">
          <input
            autoFocus
            onFocus={focusCenter}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCollapse();
            }}
            enterKeyHint="done"
            placeholder="Title"
            className="w-full p-2.5 rounded-lg border border-rule bg-white text-[16px] font-medium text-ink min-h-[42px]"
          />
          <input
            onFocus={focusCenter}
            value={draft.detail}
            onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCollapse();
            }}
            enterKeyHint="done"
            placeholder="Detail"
            className="w-full p-2.5 rounded-lg border border-rule bg-white text-[16px] text-ink min-h-[42px]"
          />
          <div className="flex items-center justify-between gap-2">
            <Chips
              options={PARTS}
              value={block.day_part}
              onChange={(v) => updateBlock(block.id, { day_part: v })}
            />
            <button
              onClick={() => {
                const snapshot = { ...block };
                onCollapse();
                deleteBlock(block.id);
                showUndo("Deleted", () => restoreBlock(snapshot));
              }}
              aria-label="Delete entry"
              className="bg-transparent border-none cursor-pointer p-2 text-[#C3BCA8] shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Itinerary({ jump }: { jump: (slug: string) => void }) {
  const { days, blocks, weather, surveys, addBlock, updateBlock, reorderDay } =
    useData();
  const [mapOpen, setMapOpen] = useState(false);
  useMapPrefetch();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Which trip day is today (blank outside Aug 14–16).
  const [todayId, setTodayId] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const d = new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setTodayId(TRIP_DATES[key] ?? null);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Vibe tally across everyone's questionnaire answers.
  const vibeCounts = new Map<string, number>();
  for (const s of surveys)
    for (const v of splitVibes(s.wants))
      vibeCounts.set(v, (vibeCounts.get(v) ?? 0) + 1);
  const vibeTally = [...vibeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([v, n]) => (n > 1 ? `${v.toLowerCase()} ×${n}` : v.toLowerCase()))
    .join(" · ");
  const [draft, setDraft] = useState<Draft>({ title: "", detail: "" });
  const expandedRef = useRef<HTMLDivElement | null>(null);
  // A drop lands a click on the dragged row — don't expand from it.
  const justDropped = useRef(false);
  const markDrop = () => {
    justDropped.current = true;
    setTimeout(() => {
      justDropped.current = false;
    }, 350);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  const expandedBlock = blocks.find((b) => b.id === expandedId) ?? null;

  const collapse = () => {
    if (expandedBlock) {
      const patch: BlockPatch = {};
      const t = draft.title.trim();
      const d = draft.detail.trim();
      if (t && t !== expandedBlock.title) patch.title = t;
      if (d !== expandedBlock.detail) patch.detail = d;
      if (Object.keys(patch).length) updateBlock(expandedBlock.id, patch);
    }
    setExpandedId(null);
  };
  const collapseRef = useRef(collapse);
  useEffect(() => {
    collapseRef.current = collapse;
  });

  const expand = (b: ItineraryBlock) => {
    if (justDropped.current) return;
    if (expandedId) collapse();
    setDraft({ title: b.title, detail: b.detail });
    setExpandedId(b.id);
  };

  useEffect(() => {
    if (!expandedId) return;
    const h = (e: PointerEvent) => {
      const el = expandedRef.current;
      if (el && !el.contains(e.target as Node)) collapseRef.current();
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [expandedId]);

  const onDragEnd = (dayBlocks: ItineraryBlock[]) => (event: DragEndEvent) => {
    markDrop();
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const flat = flatOrder(dayBlocks);
    const from = flat.findIndex((b) => b.id === active.id);
    const to = flat.findIndex((b) => b.id === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(flat, from, to);
    const neighbor = to > 0 ? next[to - 1] : next[to + 1];
    const movedPart = neighbor ? neighbor.day_part : next[to].day_part;
    reorderDay(
      next.map((b, i) => ({
        id: b.id,
        day_part: b.id === active.id ? movedPart : b.day_part,
        sort: i + 1,
      })),
    );
  };

  const sortedDays = [...days].sort((a, b) => a.sort - b.sort);

  return (
    <div className="px-3.5 pt-4 pb-5">
      <button
        onClick={() => setMapOpen(true)}
        className="block w-full text-left bg-transparent border-none p-0 cursor-pointer mb-[26px]"
      >
          <Card className="flex items-center gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-hosted thumb */}
            <img
              src="/maps/blackwoods-thumb.png"
              alt=""
              width={64}
              height={64}
              className="w-16 h-16 rounded-lg border border-rule shrink-0"
            />
            <span className="flex-1 min-w-0">
              <span className="block text-[14.5px] font-semibold text-ink">
                Base camp — Blackwoods
              </span>
              <span className="block font-mono text-[10.5px] text-mute mt-0.5">
                check-in 1 pm · checkout 11 am
              </span>
              <span className="block font-mono text-[10.5px] text-blaze mt-0.5">
                loop map
              </span>
            </span>
          </Card>
        </button>
      {sortedDays.map((d) => {
        const w = weather[d.id];
        const WIcon = w ? weatherIcon(w.condition) : null;
        const dayBlocks = blocks.filter((b) => b.day_id === d.id);
        const flat = flatOrder(dayBlocks);
        const sections = PART_ORDER.map((p) => ({
          part: p,
          items: flat.filter((b) => b.day_part === p),
        })).filter((s) => s.items.length > 0);

        return (
          <div key={d.id} data-day={d.id} className="mb-[26px]">
            <div className="flex justify-between items-end gap-2.5 mb-1">
              <div>
                <div className="font-mono text-[10px] tracking-[.12em] uppercase text-blaze">
                  {d.subtitle}
                </div>
                <h3 className="font-display font-bold text-[19px] text-ink mt-[3px] mb-0 leading-[1.15]">
                  {d.day_label}{" "}
                  <span className="text-mute font-semibold">· {d.date_label}</span>
                  {todayId === d.id && (
                    <span className="inline-block font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#FBEFE4] text-blaze uppercase tracking-[.07em] ml-2 align-middle">
                      today
                    </span>
                  )}
                </h3>
              </div>
              {w && WIcon && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <WIcon size={17} className="text-granite" />
                  <span className="font-mono text-[13px] text-ink font-medium">
                    {w.high}° / {w.low}°
                  </span>
                </div>
              )}
            </div>
            {w && <div className="text-[11.5px] text-mute mb-2">{w.condition}</div>}

            <Card className="overflow-hidden">
              {sections.length === 0 ? (
                <AddRow
                  label="Add"
                  placeholder="Title"
                  onAdd={(t) => addBlock(d.id, null, t)}
                />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd(dayBlocks)}
                  onDragCancel={markDrop}
                >
                  <SortableContext
                    items={flat.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sections.map((s, si) => (
                      <div
                        key={String(s.part)}
                        data-part={String(s.part)}
                        className={si > 0 ? "border-t border-rule" : ""}
                      >
                        {s.part && (
                          <div className="px-3.5 pt-2.5 pb-1 font-mono text-[10px] tracking-[.1em] uppercase text-granite">
                            {PART_LABEL[s.part]}
                          </div>
                        )}
                        {s.items.map((b) => (
                          <Entry
                            key={b.id}
                            block={b}
                            isExpanded={expandedId === b.id}
                            onExpand={() => expand(b)}
                            onCollapse={collapse}
                            draft={draft}
                            setDraft={setDraft}
                            expandedRef={expandedRef}
                            jump={jump}
                          />
                        ))}
                        <AddRow
                          label="Add"
                          placeholder="Title"
                          onAdd={(t) => addBlock(d.id, s.part, t)}
                        />
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </Card>
          </div>
        );
      })}

      <div className="mt-8">
        <SubH right={vibeTally || null}>What people want</SubH>
        <Ideas />
      </div>

      {mapOpen && <MapOverlay onClose={() => setMapOpen(false)} />}
    </div>
  );
}
