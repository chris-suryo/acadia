"use client";

import { useRef, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Box, Card, Input, Kill, Segmented, SubH } from "./primitives";
import { AddRow } from "./ui/AddRow";
import { Chips } from "./ui/Chips";
import { focusCenter } from "./ui/focusCenter";
import { SwipeRow } from "./ui/SwipeRow";
import { useOutside } from "./ui/useOutside";
import { useSink, vtName } from "./ui/useSink";
import { useUi } from "./ui/UiProvider";
import { useData } from "@/lib/data/context";
import { MEALS, NIGHTS } from "@/lib/seeds";
import { PARTY_SIZE } from "@/lib/config";
import type { MenuItem } from "@/lib/types";

const MEAL_CHIPS = MEALS.map((m) => ({ value: m, label: m }));

function ExpenseAdd({ onCommit }: { onCommit: (desc: string, cents: number) => void }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");

  const commit = () => {
    const a = parseFloat(amt);
    if (!desc.trim() || isNaN(a) || a < 0) return;
    onCommit(desc.trim(), Math.round(a * 100));
    setDesc("");
    setAmt("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 w-full text-left bg-transparent border-none cursor-pointer text-granite text-[13px] px-3.5 py-[11px] min-h-[44px]"
      >
        <Plus size={14} /> Add
      </button>
    );
  }

  return (
    <div
      className="flex gap-2 px-3.5 py-2"
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        if (!desc.trim() && !amt.trim()) setOpen(false);
        else commit();
      }}
    >
      <Input
        autoFocus
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="What you bought"
        enterKeyHint="next"
        className="min-h-[42px] p-2.5"
      />
      <Input
        value={amt}
        onChange={(e) => setAmt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="0.00"
        inputMode="decimal"
        enterKeyHint="done"
        className="w-24 min-h-[42px] p-2.5"
      />
    </div>
  );
}

export function Food({
  view,
  setView,
}: {
  view: string;
  setView: (v: string) => void;
}) {
  const {
    menu,
    shopping,
    expenses,
    profiles,
    userId,
    ensureName,
    addDish,
    updateDish,
    deleteDish,
    restoreDish,
    addIngredient,
    addShopping,
    toggleShopping,
    deleteShopping,
    restoreShopping,
    addExpense,
    deleteExpense,
    restoreExpense,
  } = useData();
  const { showUndo } = useUi();
  const { poke, sink } = useSink();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ dish: "", notes: "" });
  const expandedRef = useRef<HTMLDivElement | null>(null);

  const expandedDish = menu.find((m) => m.id === expandedId) ?? null;

  const collapse = () => {
    if (expandedDish) {
      const patch: { dish?: string; notes?: string } = {};
      const d = draft.dish.trim();
      const n = draft.notes.trim();
      if (d && d !== expandedDish.dish) patch.dish = d;
      if (n !== expandedDish.notes) patch.notes = n;
      if (Object.keys(patch).length) updateDish(expandedDish.id, patch);
    }
    setExpandedId(null);
  };

  const expand = (m: MenuItem) => {
    if (expandedId) collapse();
    setDraft({ dish: m.dish, notes: m.notes });
    setExpandedId(m.id);
  };

  useOutside(expandedId !== null, expandedRef, collapse);

  const ingredientsOf = (menuItemId: string) =>
    shopping
      .filter((s) => s.menu_item_id === menuItemId)
      .sort((a, b) => a.label.localeCompare(b.label));

  const menuByNight = (n: string) =>
    menu.filter((m) => m.night === n).sort((a, b) => a.sort - b.sort);

  // Store: dish ingredients in menu order, then standalone adds.
  const menuOrder = new Map(menu.map((m, i) => [m.id, i] as const));
  const storeRows = [
    ...shopping
      .filter((s) => s.menu_item_id !== null)
      .sort((a, b) => {
        const d =
          (menuOrder.get(a.menu_item_id!) ?? 0) -
          (menuOrder.get(b.menu_item_id!) ?? 0);
        return d !== 0 ? d : a.label.localeCompare(b.label);
      })
      .map((s) => {
        const dish = menu.find((m) => m.id === s.menu_item_id);
        return {
          ...s,
          tag: dish ? `${dish.dish} · ${dish.night}` : "Menu",
          tagTone: "moss" as const,
          standalone: false,
        };
      }),
    ...shopping
      .filter((s) => s.menu_item_id === null)
      .map((s) => {
        const who = s.added_by ? profiles[s.added_by]?.trim() : "";
        return {
          ...s,
          tag: who ? `added by ${who}` : "added",
          tagTone: "blaze" as const,
          standalone: true,
        };
      }),
  ];

  const sunkStoreRows = sink(storeRows);
  const storeLeft = shopping.filter((s) => !s.checked).length;
  const myPaid = expenses
    .filter((e) => e.user_id === userId)
    .reduce((s, e) => s + e.amount_cents, 0);

  const total = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const sortedExpenses = [...expenses].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const dishRow = (f: MenuItem) => {
    const ings = ingredientsOf(f.id);
    const who = f.added_by ? profiles[f.added_by]?.trim() : "";
    const metadata = [
      f.meal,
      who,
      ings.length > 0
        ? `${ings.filter((i) => i.checked).length}/${ings.length} ingredients`
        : "",
    ].filter(Boolean);

    if (expandedId !== f.id) {
      return (
        <button
          key={f.id}
          onClick={() => expand(f)}
          className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-2.5 px-3.5 py-3 border-b border-rule"
        >
          <span className="flex-1 min-w-0">
            <span className="block text-[14.5px] text-ink font-medium">{f.dish}</span>
            {f.notes && (
              <span className="block text-[11.5px] text-mute mt-0.5 leading-[1.4]">
                {f.notes}
              </span>
            )}
            <span className="block font-mono text-[10.5px] text-mute mt-[3px]">
              {metadata.map((m, i) => (
                <span key={i} className={i === 1 && who ? "text-moss" : ""}>
                  {i > 0 && " · "}
                  {m}
                </span>
              ))}
            </span>
          </span>
          <ChevronDown size={15} className="text-mute shrink-0" />
        </button>
      );
    }

    return (
      <div
        key={f.id}
        ref={expandedRef}
        className="px-3.5 py-3 bg-[#FBF8EE] border-b border-rule"
      >
        <div className="grid gap-2">
          <input
            autoFocus
            onFocus={focusCenter}
            value={draft.dish}
            onChange={(e) => setDraft({ ...draft, dish: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") collapse();
            }}
            enterKeyHint="done"
            placeholder="Dish"
            className="w-full p-2.5 rounded-lg border border-rule bg-white text-[16px] font-medium text-ink min-h-[42px]"
          />
          <Chips
            options={MEAL_CHIPS}
            value={f.meal}
            onChange={(v) => updateDish(f.id, { meal: v })}
          />
          <input
            onFocus={focusCenter}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") collapse();
            }}
            enterKeyHint="done"
            placeholder="Notes — allergies, who's cooking"
            className="w-full p-2.5 rounded-lg border border-rule bg-white text-[16px] text-ink min-h-[42px]"
          />
          <div>
            {ings.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 py-[5px]">
                <Box on={s.checked} onClick={() => toggleShopping(s.id)} />
                <div
                  className={`flex-1 text-[13.5px] text-ink ${
                    s.checked ? "line-through opacity-50" : ""
                  }`}
                >
                  {s.label}
                </div>
                <Kill onClick={() => deleteShopping(s.id)} />
              </div>
            ))}
            <div className="-mx-3.5">
              <AddRow
                label="Add ingredient"
                placeholder="Ingredient"
                onAdd={(t) => addIngredient(f.id, t)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                const snapshot = { ...f };
                const snapIngs = ings.map((s) => ({ ...s }));
                collapse();
                deleteDish(f.id);
                showUndo("Deleted", () => restoreDish(snapshot, snapIngs));
              }}
              aria-label="Delete dish"
              className="bg-transparent border-none cursor-pointer p-2 text-[#C3BCA8]"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-3.5 pt-4 pb-[60px]">
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { id: "menu", label: "Menu" },
          { id: "shop", label: storeLeft > 0 ? `Store · ${storeLeft} left` : "Store" },
          { id: "money", label: "Expenses" },
        ]}
      />

      {view === "menu" && (
        <>
          {NIGHTS.map((n) => {
            const rows = menuByNight(n);
            return (
              <div key={n} className="mb-5">
                <SubH>{n}</SubH>
                <Card className="overflow-hidden">
                  {rows.map((f) => dishRow(f))}
                  <AddRow
                    label="Add"
                    placeholder="Dish"
                    onAdd={(t) =>
                      ensureName(() =>
                        addDish({ night: n, meal: "Dinner", dish: t, notes: "" }),
                      )
                    }
                  />
                </Card>
              </div>
            );
          })}
        </>
      )}

      {view === "shop" && (
        <Card className="overflow-hidden">
          {sunkStoreRows.length === 0 && (
            <div className="p-5 text-[13.5px] text-mute text-center border-b border-rule">
              Dishes from the menu appear here.
            </div>
          )}
          {sunkStoreRows.map((g) => {
            const row = (
              <button
                onClick={() => {
                  toggleShopping(g.id);
                  poke(g.id);
                }}
                style={vtName(g.id)}
                className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-[11px] px-3.5 py-3"
              >
                <Box on={g.checked} />
                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-[14.5px] text-ink ${
                      g.checked ? "line-through opacity-50" : ""
                    }`}
                  >
                    {g.label}
                  </span>
                  <span
                    className={`block font-mono text-[10.5px] mt-0.5 ${
                      g.tagTone === "moss" ? "text-moss" : "text-blaze"
                    }`}
                  >
                    {g.tag}
                  </span>
                </span>
              </button>
            );
            return g.standalone ? (
              <SwipeRow
                key={g.id}
                className="border-b border-rule"
                onDelete={() => {
                  const snap = { ...g };
                  deleteShopping(g.id);
                  showUndo("Deleted", () =>
                    restoreShopping({
                      id: snap.id,
                      menu_item_id: snap.menu_item_id,
                      label: snap.label,
                      added_by: snap.added_by,
                      checked: snap.checked,
                      checked_by: snap.checked_by,
                    }),
                  );
                }}
              >
                {row}
              </SwipeRow>
            ) : (
              <div key={g.id} className="border-b border-rule">
                {row}
              </div>
            );
          })}
          <AddRow
            label="Add"
            placeholder="Snacks, ice, paper towels…"
            onAdd={(t) => addShopping(t)}
          />
        </Card>
      )}

      {view === "money" && (
        <>
          <Card className="overflow-hidden">
            {sortedExpenses.length === 0 && (
              <div className="p-5 text-[13.5px] text-mute text-center border-b border-rule">
                No expenses logged.
              </div>
            )}
            {sortedExpenses.map((e) => {
              const who = profiles[e.user_id]?.trim() || "";
              const row = (
                <div className="flex items-center gap-2.5 px-3.5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-ink">{e.description}</div>
                    {who && (
                      <div className="font-mono text-[10.5px] text-moss mt-0.5">
                        {who}
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-[14px] text-ink font-medium">
                    ${(e.amount_cents / 100).toFixed(2)}
                  </div>
                </div>
              );
              return e.user_id === userId ? (
                <SwipeRow
                  key={e.id}
                  className="border-b border-rule"
                  onDelete={() => {
                    const snap = { ...e };
                    deleteExpense(e.id);
                    showUndo("Deleted", () => restoreExpense(snap));
                  }}
                >
                  {row}
                </SwipeRow>
              ) : (
                <div key={e.id} className="border-b border-rule">
                  {row}
                </div>
              );
            })}
            <ExpenseAdd
              onCommit={(desc, cents) => ensureName(() => addExpense(desc, cents))}
            />
            {sortedExpenses.length > 0 && (
              <div className="px-3.5 py-3 bg-[#F2EFE3] border-t border-rule">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-granite">
                    ${(total / 100 / PARTY_SIZE).toFixed(2)} each, split {PARTY_SIZE}{" "}
                    ways
                  </span>
                  <span className="font-mono text-[15px] text-ink font-semibold">
                    ${(total / 100).toFixed(2)}
                  </span>
                </div>
                {myPaid > 0 && (
                  <div className="text-right font-mono text-[11px] text-granite mt-1">
                    you&apos;ve paid ${(myPaid / 100).toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
