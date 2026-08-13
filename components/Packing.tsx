"use client";

import { useRef, useState } from "react";
import { Lock } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Card, Segmented, SubH } from "./primitives";
import { AddRow } from "./ui/AddRow";
import { Avatar } from "./ui/Avatar";
import { Progress } from "./ui/Progress";
import { sectionIcon } from "./ui/categoryIcon";
import { SwipeRow } from "./ui/SwipeRow";
import { useSink, vtName } from "./ui/useSink";
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

type FlatRef = { id: string; parentId: string | null; cat: string; child: boolean };

// Turns a drop into the minimal set of category/sort rewrites. The moved
// parent inherits its new neighbor's category (children follow via the
// regrouping render); a child drop is valid only inside its own bundle.
function planReorder(
  flat: FlatRef[],
  activeId: string,
  overId: string,
  current: { id: string; category: string; sort: number }[],
): { id: string; category: string; sort: number }[] | null {
  const from = flat.findIndex((r) => r.id === activeId);
  const to = flat.findIndex((r) => r.id === overId);
  if (from < 0 || to < 0) return null;
  const next = arrayMove(flat, from, to);
  const idx = next.findIndex((r) => r.id === activeId);
  const moved = next[idx];

  if (moved.child) {
    const above = next[idx - 1];
    if (!above || (above.id !== moved.parentId && above.parentId !== moved.parentId))
      return null;
  }

  const catOf = new Map<string, string>();
  for (const r of next) if (!r.child) catOf.set(r.id, r.cat);
  if (!moved.child) {
    const neighbor = idx > 0 ? next[idx - 1] : next[idx + 1];
    if (neighbor) {
      const ncat = neighbor.child
        ? (catOf.get(neighbor.parentId!) ?? neighbor.cat)
        : catOf.get(neighbor.id)!;
      catOf.set(moved.id, ncat);
    }
  }

  const out: { id: string; category: string; sort: number }[] = [];
  const parentN = new Map<string, number>();
  const childN = new Map<string, number>();
  for (const r of next) {
    if (!r.child) {
      const cat = catOf.get(r.id)!;
      const n = (parentN.get(cat) ?? 0) + 1;
      parentN.set(cat, n);
      out.push({ id: r.id, category: cat, sort: n });
    } else {
      const cat = catOf.get(r.parentId!) ?? r.cat;
      const n = (childN.get(r.parentId!) ?? 0) + 1;
      childN.set(r.parentId!, n);
      out.push({ id: r.id, category: cat, sort: n });
    }
  }

  const cur = new Map(current.map((c) => [c.id, { category: c.category, sort: c.sort }]));
  return out.filter((r) => {
    const c = cur.get(r.id);
    return !c || c.category !== r.category || c.sort !== r.sort;
  });
}

// Whole-row sortable wrapper. Long-press lifts on touch; vertical mouse drag
// lifts on desktop; horizontal stays with SwipeRow (activation is y-gated).
function SortRow({
  id,
  swipeDisabled,
  onDelete,
  children,
}: {
  id: string;
  swipeDisabled: boolean;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-60 relative z-10" : ""}
    >
      <SwipeRow disabled={swipeDisabled} onDelete={onDelete} className="border-b border-rule">
        {children}
      </SwipeRow>
    </div>
  );
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
    gearClaims,
    personal,
    profiles,
    isMe,
    memberOf,
    toggleClaimGear,
    addGear,
    deleteGear,
    restoreGear,
    reorderGear,
    reorderPersonal,
    togglePersonal,
    addPersonal,
    deletePersonal,
    restorePersonal,
    ensureName,
  } = useData();
  const { showUndo, showNotice } = useUi();
  const { poke, sink } = useSink();
  const [dragActive, setDragActive] = useState(false);
  // A drop lands a click on the dragged row — swallow it briefly.
  const justDropped = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: { y: 8 } } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  /**
   * Everyone who's said they're bringing this one, one entry per person.
   *
   * Deduped by person, not device: signing in on a phone and a laptop is one
   * tent, and it shouldn't read as two faces on the row.
   */
  const claimersOf = (id: string) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of gearClaims) {
      if (c.gear_item_id !== id) continue;
      const who = memberOf(c.user_id) || c.user_id;
      if (seen.has(who)) continue;
      seen.add(who);
      out.push(c.user_id);
    }
    return out;
  };
  const iClaimed = (id: string) =>
    gearClaims.some((c) => c.gear_item_id === id && isMe(c.user_id));

  const claimed = gear.filter((i) => claimersOf(i.id).length > 0).length;
  const mine = gear.filter((i) => iClaimed(i.id)).length;
  const done = personal.filter((i) => i.checked).length;

  const groupTree = (cat: string) => tree(gear.filter((i) => i.category === cat));
  const mineTree = (cat: string) => {
    const rows = personal.filter((i) => i.category === cat);
    const parents = sink(
      rows.filter((r) => !r.parent_id).sort((a, b) => a.sort - b.sort),
    );
    return parents.flatMap((p) => [
      { item: p, child: false },
      ...rows
        .filter((r) => r.parent_id === p.id)
        .sort((a, b) => a.sort - b.sort)
        .map((c) => ({ item: c, child: true })),
    ]);
  };

  const gCats = orderedCats(GEAR_CATEGORIES, [...new Set(gear.map((i) => i.category))]);
  const mCats = orderedCats(PERSONAL_CATEGORIES, [
    ...new Set(personal.map((i) => i.category)),
  ]);

  const groupFlat: FlatRef[] = gCats.flatMap((cat) =>
    groupTree(cat).map(({ item, child }) => ({
      id: item.id,
      parentId: item.parent_id,
      cat,
      child,
    })),
  );
  const mineFlat: FlatRef[] = mCats.flatMap((cat) =>
    mineTree(cat).map(({ item, child }) => ({
      id: item.id,
      parentId: item.parent_id,
      cat,
      child,
    })),
  );

  const onDragStart = (e: DragStartEvent) => {
    setDragActive(true);
    // Long-press lifts the row for reorder — still surface who's on it.
    const who = namesOn(String(e.active.id));
    if (who && !iClaimed(String(e.active.id))) showNotice(`${who} bringing this`);
  };
  const endDrag = () => {
    justDropped.current = true;
    setTimeout(() => {
      justDropped.current = false;
    }, 350);
    setDragActive(false);
  };
  const onDragEndGroup = (e: DragEndEvent) => {
    endDrag();
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const rows = planReorder(groupFlat, String(active.id), String(over.id), gear);
    if (rows?.length) reorderGear(rows);
  };
  const onDragEndMine = (e: DragEndEvent) => {
    endDrag();
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const rows = planReorder(mineFlat, String(active.id), String(over.id), personal);
    if (rows?.length) reorderPersonal(rows);
  };

  /** Names on a row, as you'd say them out loud. */
  const namesOn = (id: string) => {
    const names = claimersOf(id).map((u) => profiles[u]?.trim() || "someone");
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} + ${names[1]}`;
    return `${names[0]} +${names.length - 1}`;
  };

  // Someone else being on a row is no longer a reason you can't be: two people
  // with tents both need to say so, and the row has to show both.
  const claim = (id: string) => ensureName(() => toggleClaimGear(id));

  const gearRow = (i: GearItem, child: boolean) => {
    const claimers = claimersOf(i.id);
    const mineToo = iClaimed(i.id);
    const who = namesOn(i.id);
    return (
      <SortRow
        key={i.id}
        id={i.id}
        swipeDisabled={dragActive}
        onDelete={() => {
          const snap = { ...i };
          const kids = child ? [] : gear.filter((g) => g.parent_id === i.id).map((g) => ({ ...g }));
          deleteGear(i.id);
          showUndo("Deleted", () => restoreGear(snap, kids));
        }}
      >
        <button
          // The box is decorative (aria-hidden), so the row itself has to say
          // what it is and whether it's on — otherwise a screen reader reads a
          // list of labels with no state at all.
          role="checkbox"
          aria-checked={claimers.length > 0}
          aria-label={
            claimers.length === 0
              ? `${i.label} — nobody bringing it`
              : `${i.label} — ${who} bringing it${mineToo ? ", including you" : ""}`
          }
          onClick={() => {
            if (justDropped.current) return;
            claim(i.id);
          }}
          className={`w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-[11px] py-3 pr-3.5 ${
            child ? "pl-9" : "pl-3.5"
          }`}
        >
          <Box on={claimers.length > 0} size={22} />
          <span className="flex-1 min-w-0">
            <span className="block text-[14.5px] text-ink leading-[1.35]">{i.label}</span>
          </span>
          {/* Faces first, then the offer. A row someone else has taken still
              offers "+ me", because two people can both own a tent and the old
              list had no way to say so. */}
          {claimers.length > 0 && (
            <span className="inline-flex items-center gap-1.5 shrink-0 max-w-[46%]">
              <span className="flex items-center -space-x-1.5">
                {claimers.slice(0, 3).map((u) => (
                  <Avatar
                    key={u}
                    userId={u}
                    name={profiles[u]?.trim() || "?"}
                    size={22}
                  />
                ))}
              </span>
              <span className="font-mono text-[10.5px] text-moss truncate">{who}</span>
            </span>
          )}
          {!mineToo && (
            <span className="font-mono text-[10.5px] text-blaze shrink-0 border border-blaze/40 rounded-full px-2 py-0.5">
              {claimers.length > 0 ? "+ me" : "claim"}
            </span>
          )}
        </button>
      </SortRow>
    );
  };

  const personalRow = (i: PersonalItem, child: boolean) => (
    <SortRow
      key={i.id}
      id={i.id}
      swipeDisabled={dragActive}
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
        role="checkbox"
        aria-checked={i.checked}
        aria-label={i.note ? `${i.label} — ${i.note}` : i.label}
        onClick={() => {
          if (justDropped.current) return;
          togglePersonal(i.id);
          if (!child) poke(i.id);
        }}
        style={vtName(i.id)}
        className={`w-full text-left bg-transparent border-none cursor-pointer flex items-start gap-[11px] py-3 pr-3.5 ${
          child ? "pl-12" : "pl-3.5"
        }`}
      >
        <Box on={i.checked} size={22} />
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
    </SortRow>
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEndGroup}
          onDragCancel={endDrag}
        >
          <Progress
            done={claimed}
            total={gear.length}
            label="claimed"
            right={mine > 0 ? `${mine} yours` : null}
          />
          <SortableContext
            items={groupFlat.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {gCats.map((cat) => (
              <div key={cat} className="mb-5">
                <SubH icon={sectionIcon(cat)}>{cat}</SubH>
                <Card className="overflow-hidden">
                  {groupTree(cat).map(({ item, child }) => gearRow(item, child))}
                  <AddRow label="Add" placeholder="Item" onAdd={(t) => addGear(cat, t)} />
                </Card>
              </div>
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <>
          <Progress
            done={done}
            total={personal.length}
            label="packed"
            right={
              <>
                <Lock size={11} /> only visible to you
              </>
            }
          />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEndMine}
            onDragCancel={endDrag}
          >
            <SortableContext
              items={mineFlat.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {mCats.map((cat) => (
                <div key={cat} className="mb-5">
                  <SubH icon={sectionIcon(cat)}>{cat}</SubH>
                  <Card className="overflow-hidden">
                    {mineTree(cat).map(({ item, child }) => personalRow(item, child))}
                    <AddRow
                      label="Add"
                      placeholder="Item"
                      onAdd={(t) => addPersonal(cat, t)}
                    />
                  </Card>
                </div>
              ))}
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
