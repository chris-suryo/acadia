"use client";

import { useRef, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { Box, Btn, Card, Input, Kill, Segmented, Select, SubH } from "./primitives";
import { useData } from "@/lib/data/context";
import { MEALS, NIGHTS } from "@/lib/seeds";
import { PARTY_SIZE } from "@/lib/config";
import type { MenuItem, ShoppingItem } from "@/lib/types";

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
    requireName,
    addDish,
    deleteDish,
    addIngredient,
    addShopping,
    toggleShopping,
    deleteShopping,
    addExpense,
    deleteExpense,
  } = useData();

  const [meal, setMeal] = useState("Dinner");
  const [night, setNight] = useState("Friday");
  const [dishTxt, setDishTxt] = useState("");
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ingTxt, setIngTxt] = useState("");
  const ingInputRef = useRef<HTMLInputElement | null>(null);
  const [xTxt, setXTxt] = useState("");
  const [eWhat, setEWhat] = useState("");
  const [eAmt, setEAmt] = useState("");

  const ingredientsOf = (menuItemId: string) =>
    shopping
      .filter((s) => s.menu_item_id === menuItemId)
      .sort((a, b) => a.label.localeCompare(b.label));

  const submitDish = () => {
    if (!dishTxt.trim()) return;
    if (!requireName()) return;
    const id = addDish({
      night,
      meal,
      dish: dishTxt.trim(),
      notes: notes.trim(),
    });
    setDishTxt("");
    setNotes("");
    setExpanded(id);
    setIngTxt("");
    setTimeout(() => ingInputRef.current?.focus(), 50);
  };

  const submitIngredient = (menuItemId: string) => {
    if (!ingTxt.trim()) return;
    addIngredient(menuItemId, ingTxt.trim());
    setIngTxt("");
    ingInputRef.current?.focus();
  };

  const toggleExpand = (id: string) => {
    setIngTxt("");
    setExpanded((cur) => (cur === id ? null : id));
  };

  const addExtra = () => {
    if (!xTxt.trim()) return;
    addShopping(xTxt.trim());
    setXTxt("");
  };

  const submitExpense = () => {
    const amt = parseFloat(eAmt);
    if (!eWhat.trim() || isNaN(amt) || amt < 0) return;
    if (!requireName()) return;
    addExpense(eWhat.trim(), Math.round(amt * 100));
    setEWhat("");
    setEAmt("");
  };

  const menuByNight = (n: string) =>
    menu.filter((m) => m.night === n).sort((a, b) => a.sort - b.sort);

  // Store: dish ingredients in menu order, then standalone adds.
  const menuOrder = new Map(menu.map((m, i) => [m.id, i] as const));
  const storeRows: (ShoppingItem & { tag: string; tagTone: "moss" | "blaze"; standalone: boolean })[] =
    [
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

  const total = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const sortedExpenses = [...expenses].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const dishRow = (f: MenuItem, idx: number, count: number) => {
    const ings = ingredientsOf(f.id);
    const isOpen = expanded === f.id;
    const who = f.added_by ? profiles[f.added_by]?.trim() : "";
    return (
      <div
        key={f.id}
        className={idx < count - 1 ? "border-b border-rule" : ""}
      >
        <div className="flex items-start gap-2.5 pl-3.5 pr-2 py-3">
          <div className="w-[58px] shrink-0 font-mono text-[9.5px] text-blaze uppercase tracking-[.07em] pt-[3px]">
            {f.meal}
          </div>
          <button
            onClick={() => toggleExpand(f.id)}
            className="flex-1 min-w-0 bg-transparent border-none p-0 text-left cursor-pointer"
          >
            <div className="text-[14.5px] text-ink font-medium">{f.dish}</div>
            {f.notes && (
              <div className="text-[11.5px] text-mute mt-0.5 leading-[1.4]">
                {f.notes}
              </div>
            )}
            <div className="font-mono text-[10.5px] mt-[3px]">
              {who && <span className="text-moss">{who}</span>}
              {who && ings.length > 0 && <span className="text-mute"> · </span>}
              {ings.length > 0 && (
                <span className="text-mute">
                  {ings.filter((i) => i.checked).length}/{ings.length} ingredients
                </span>
              )}
            </div>
          </button>
          <Kill onClick={() => deleteDish(f.id)} />
        </div>
        {isOpen && (
          <div className="pl-[78px] pr-3.5 pb-3">
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
            <div className="flex gap-2 mt-1.5">
              <Input
                ref={ingInputRef}
                value={ingTxt}
                onChange={(e) => setIngTxt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitIngredient(f.id);
                }}
                placeholder="Ingredient"
                className="min-h-[42px] text-[14px] px-2.5 py-2"
              />
              <Btn small onClick={() => submitIngredient(f.id)} ariaLabel="Add ingredient">
                <Plus size={14} />
              </Btn>
            </div>
          </div>
        )}
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
          { id: "shop", label: "Store" },
          { id: "money", label: "Expenses" },
        ]}
      />

      {view === "menu" && (
        <>
          {NIGHTS.map((n) => {
            const rows = menuByNight(n);
            if (!rows.length) return null;
            return (
              <div key={n} className="mb-5">
                <SubH>{n}</SubH>
                <Card>{rows.map((f, idx) => dishRow(f, idx, rows.length))}</Card>
              </div>
            );
          })}

          <Card className="p-3.5">
            <SubH>Add a dish</SubH>
            <div className="grid gap-2">
              <Input
                value={dishTxt}
                onChange={(e) => setDishTxt(e.target.value)}
                placeholder="Dish"
              />
              <div className="flex gap-2">
                <Select
                  value={night}
                  onChange={(e) => setNight(e.target.value)}
                  className="flex-1"
                >
                  {NIGHTS.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </Select>
                <Select
                  value={meal}
                  onChange={(e) => setMeal(e.target.value)}
                  className="flex-1"
                >
                  {MEALS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </div>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes — allergies, who's cooking"
              />
              <Btn onClick={submitDish} full>
                <Plus size={15} /> Add
              </Btn>
            </div>
          </Card>
        </>
      )}

      {view === "shop" && (
        <>
          <Card className="mb-2.5">
            {storeRows.length === 0 && (
              <div className="p-5 text-[13.5px] text-mute text-center">
                Dishes from the menu appear here.
              </div>
            )}
            {storeRows.map((g, idx) => (
              <div
                key={g.id}
                className={`flex items-center gap-[11px] pl-3.5 pr-2 py-3 ${
                  idx < storeRows.length - 1 ? "border-b border-rule" : ""
                }`}
              >
                <Box on={g.checked} onClick={() => toggleShopping(g.id)} />
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[14.5px] text-ink ${
                      g.checked ? "line-through opacity-50" : ""
                    }`}
                  >
                    {g.label}
                  </div>
                  <div
                    className={`font-mono text-[10.5px] mt-0.5 ${
                      g.tagTone === "moss" ? "text-moss" : "text-blaze"
                    }`}
                  >
                    {g.tag}
                  </div>
                </div>
                {g.standalone && <Kill onClick={() => deleteShopping(g.id)} />}
              </div>
            ))}
          </Card>

          <div className="flex gap-2">
            <Input
              value={xTxt}
              onChange={(e) => setXTxt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addExtra();
              }}
              placeholder="Snacks, ice, paper towels…"
            />
            <Btn onClick={addExtra} ariaLabel="Add item">
              <Plus size={15} />
            </Btn>
          </div>
        </>
      )}

      {view === "money" && (
        <>
          <Card className="mb-3">
            {sortedExpenses.length === 0 && (
              <div className="p-5 text-[13.5px] text-mute text-center">
                No expenses logged.
              </div>
            )}
            {sortedExpenses.map((e, idx) => {
              const who = profiles[e.user_id]?.trim() || "";
              return (
                <div
                  key={e.id}
                  className={`flex items-center gap-2.5 pl-3.5 pr-2 py-3 ${
                    idx < sortedExpenses.length - 1 ? "border-b border-rule" : ""
                  }`}
                >
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
                  {e.user_id === userId ? (
                    <Kill onClick={() => deleteExpense(e.id)} />
                  ) : (
                    <div className="w-[27px]" />
                  )}
                </div>
              );
            })}
            {sortedExpenses.length > 0 && (
              <div className="px-3.5 py-3 bg-[#F2EFE3] flex justify-between items-center rounded-b-[10px]">
                <span className="text-[13px] text-granite">
                  ${(total / 100 / PARTY_SIZE).toFixed(2)} each, split {PARTY_SIZE}{" "}
                  ways
                </span>
                <span className="font-mono text-[15px] text-ink font-semibold">
                  ${(total / 100).toFixed(2)}
                </span>
              </div>
            )}
          </Card>

          <Card className="p-3.5">
            <SubH>Log an expense</SubH>
            <div className="grid gap-2">
              <Input
                value={eWhat}
                onChange={(e) => setEWhat(e.target.value)}
                placeholder="What you bought"
              />
              <Input
                value={eAmt}
                onChange={(e) => setEAmt(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
              />
              <Btn onClick={submitExpense} tone="granite" full>
                <Receipt size={15} /> Log
              </Btn>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
