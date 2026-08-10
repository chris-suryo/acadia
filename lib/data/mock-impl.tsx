"use client";

// In-memory data engine seeded from lib/seeds — lets the full UI run (and be
// driven by Playwright) in environments that can't reach Supabase. Selected
// with NEXT_PUBLIC_DATA_MODE=mock; never bundled into the deployed flow.

import { useMemo, useState } from "react";
import { Ctx, newId, nextSort, type DataCtx, type DayWeather } from "./context";
import { useNameGate } from "./name-gate";
import {
  SEED_BLOCKS,
  SEED_DAYS,
  SEED_GEAR,
  SEED_MENU,
  SEED_PERSONAL,
} from "@/lib/seeds";
import type {
  Expense,
  GearItem,
  ItineraryBlock,
  MenuItem,
  PersonalItem,
  ShoppingItem,
} from "@/lib/types";

const ME = "mock-user";

const MOCK_WEATHER: Record<string, DayWeather> = {
  fri: { high: 79, low: 57, condition: "Morning shower, then clearing" },
  sat: { high: 77, low: 55, condition: "Partly sunny, clear night" },
  sun: { high: 75, low: 58, condition: "Partly sunny, showers late" },
};

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState("");
  const { nameInputRef, nameFlash, requireName } = useNameGate(name);

  const [blocks, setBlocks] = useState<ItineraryBlock[]>(() =>
    SEED_BLOCKS.map((b, i) => ({ id: `blk-${i}`, ...b })),
  );
  const [gear, setGear] = useState<GearItem[]>(() =>
    SEED_GEAR.map((g, i) => ({ id: `gear-${i}`, parent_id: null, owner_id: null, ...g })),
  );
  const [personal, setPersonal] = useState<PersonalItem[]>(() =>
    SEED_PERSONAL.map((p, i) => ({
      id: `mine-${i}`,
      user_id: ME,
      parent_id: null,
      checked: false,
      ...p,
    })),
  );
  const [menu, setMenu] = useState<MenuItem[]>(() =>
    SEED_MENU.map((m, i) => ({ id: `menu-${i}`, added_by: null, ...m })),
  );
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const value = useMemo<DataCtx>(() => {
    const setName = (n: string) => setNameState(n);

    return {
      ready: true,
      error: null,
      userId: ME,
      name,
      setName,
      nameFlash,
      nameInputRef,
      requireName,
      profiles: { [ME]: name.trim() },
      days: SEED_DAYS,
      blocks,
      gear,
      personal,
      menu,
      shopping,
      expenses,
      forecast: [],
      weather: MOCK_WEATHER,
      addBlock: (dayId, dayPart, title) => {
        const id = newId();
        setBlocks((prev) => [
          ...prev,
          {
            id,
            day_id: dayId,
            title,
            detail: "",
            day_part: dayPart,
            link_slug: null,
            sort: nextSort(prev.filter((b) => b.day_id === dayId)),
          },
        ]);
        return id;
      },
      updateBlock: (id, patch) =>
        setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b))),
      deleteBlock: (id) => setBlocks((prev) => prev.filter((b) => b.id !== id)),
      restoreBlock: (row) =>
        setBlocks((prev) => [...prev.filter((b) => b.id !== row.id), row]),
      reorderDay: (rows) => {
        const byId = new Map(rows.map((r) => [r.id, r]));
        setBlocks((prev) =>
          prev.map((b) => {
            const r = byId.get(b.id);
            return r ? { ...b, day_part: r.day_part, sort: r.sort } : b;
          }),
        );
      },
      toggleClaimGear: (id) =>
        setGear((prev) =>
          prev.map((g) =>
            g.id === id ? { ...g, owner_id: g.owner_id ? null : ME } : g,
          ),
        ),
      addGear: (category, label) =>
        setGear((prev) => [
          ...prev,
          {
            id: newId(),
            category,
            parent_id: null,
            label,
            owner_id: null,
            sort: nextSort(prev.filter((g) => g.category === category)),
          },
        ]),
      deleteGear: (id) => setGear((prev) => prev.filter((g) => g.id !== id && g.parent_id !== id)),
      togglePersonal: (id) =>
        setPersonal((prev) =>
          prev.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p)),
        ),
      addPersonal: (category, label) =>
        setPersonal((prev) => [
          ...prev,
          {
            id: newId(),
            user_id: ME,
            category,
            parent_id: null,
            label,
            note: "",
            checked: false,
            sort: nextSort(prev.filter((p) => p.category === category)),
          },
        ]),
      deletePersonal: (id) =>
        setPersonal((prev) => prev.filter((p) => p.id !== id && p.parent_id !== id)),
      addDish: ({ night, meal, dish, notes }) => {
        const id = newId();
        setMenu((prev) => [
          ...prev,
          { id, night, meal, dish, notes, added_by: ME, sort: nextSort(prev) },
        ]);
        return id;
      },
      deleteDish: (id) => {
        setMenu((prev) => prev.filter((m) => m.id !== id));
        setShopping((prev) => prev.filter((s) => s.menu_item_id !== id));
      },
      addIngredient: (menuItemId, label) =>
        setShopping((prev) => [
          ...prev,
          { id: newId(), menu_item_id: menuItemId, label, added_by: ME, checked: false, checked_by: null },
        ]),
      addShopping: (label) =>
        setShopping((prev) => [
          ...prev,
          { id: newId(), menu_item_id: null, label, added_by: ME, checked: false, checked_by: null },
        ]),
      toggleShopping: (id) =>
        setShopping((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, checked: !s.checked, checked_by: s.checked ? null : ME }
              : s,
          ),
        ),
      deleteShopping: (id) => setShopping((prev) => prev.filter((s) => s.id !== id)),
      addExpense: (description, amountCents) =>
        setExpenses((prev) => [
          ...prev,
          {
            id: newId(),
            user_id: ME,
            description,
            amount_cents: amountCents,
            created_at: new Date().toISOString(),
          },
        ]),
      deleteExpense: (id) => setExpenses((prev) => prev.filter((e) => e.id !== id)),
    };
  }, [name, nameFlash, nameInputRef, requireName, blocks, gear, personal, menu, shopping, expenses]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
