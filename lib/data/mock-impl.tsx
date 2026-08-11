"use client";

// In-memory data engine seeded from lib/seeds — lets the full UI run (and be
// driven by Playwright) in environments that can't reach Supabase. Selected
// with NEXT_PUBLIC_DATA_MODE=mock; never bundled into the deployed flow.

import { useMemo, useState } from "react";
import { Ctx, newId, nextSort, type DataCtx, type DayWeather } from "./context";
import { NameSheet, useNameSheet } from "@/components/ui/NameSheet";
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
  SurveyRow,
} from "@/lib/types";

const ME = "mock-user";

const MOCK_WEATHER: Record<string, DayWeather> = {
  fri: { high: 79, low: 57, condition: "Morning shower, then clearing" },
  sat: { high: 77, low: 55, condition: "Partly sunny, clear night" },
  sun: { high: 75, low: 58, condition: "Partly sunny, showers late" },
};

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState("");
  const { ensureName, sheetOpen, submit, cancel } = useNameSheet(
    !!name.trim(),
    (n) => setNameState(n),
  );

  const [blocks, setBlocks] = useState<ItineraryBlock[]>(() =>
    SEED_BLOCKS.map((b, i) => ({ id: `blk-${i}`, ...b })),
  );
  const [gear, setGear] = useState<GearItem[]>(() => {
    const idByLabel = new Map<string, string>();
    SEED_GEAR.forEach((g, i) => {
      if (!g.parent) idByLabel.set(g.label, `gear-${i}`);
    });
    return SEED_GEAR.map((g, i) => ({
      id: `gear-${i}`,
      category: g.category,
      parent_id: g.parent ? (idByLabel.get(g.parent) ?? null) : null,
      label: g.label,
      owner_id: null,
      sort: g.sort,
    }));
  });
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
  const [surveys, setSurveys] = useState<SurveyRow[]>([
    // One neighbor's answers so the Ideas board renders populated in mock runs.
    {
      user_id: "mock-alana",
      activity: "One good hike",
      hikes: "Beehive if the ladders aren't crowded",
      wants: "Big hikes · Swimming · Camp hangs",
      bar_harbor: "",
      food: "S'mores. Non-negotiable.",
      updated_at: "2026-08-10T12:00:00Z",
    },
  ]);

  const value = useMemo<DataCtx>(() => {
    const setName = (n: string) => setNameState(n);

    return {
      ready: true,
      error: null,
      userId: ME,
      name,
      setName,
      ensureName,
      profiles: { [ME]: name.trim(), "mock-alana": "Alana" },
      days: SEED_DAYS,
      blocks,
      gear,
      personal,
      menu,
      shopping,
      expenses,
      surveys,
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
        setGear((prev) => {
          const item = prev.find((g) => g.id === id);
          if (!item) return prev;
          const owner = item.owner_id ? null : ME;
          const ids = item.parent_id
            ? [id]
            : prev.filter((g) => g.id === id || g.parent_id === id).map((g) => g.id);
          return prev.map((g) => (ids.includes(g.id) ? { ...g, owner_id: owner } : g));
        }),
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
      reorderGear: (rows) => {
        const byId = new Map(rows.map((r) => [r.id, r]));
        setGear((prev) =>
          prev.map((g) => {
            const r = byId.get(g.id);
            return r ? { ...g, category: r.category, sort: r.sort } : g;
          }),
        );
      },
      reorderPersonal: (rows) => {
        const byId = new Map(rows.map((r) => [r.id, r]));
        setPersonal((prev) =>
          prev.map((p) => {
            const r = byId.get(p.id);
            return r ? { ...p, category: r.category, sort: r.sort } : p;
          }),
        );
      },
      togglePersonal: (id) =>
        setPersonal((prev) => {
          const item = prev.find((p) => p.id === id);
          if (!item) return prev;
          const checked = !item.checked;
          const ids = item.parent_id
            ? [id]
            : prev.filter((p) => p.id === id || p.parent_id === id).map((p) => p.id);
          return prev.map((p) => (ids.includes(p.id) ? { ...p, checked } : p));
        }),
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
      updateDish: (id, patch) =>
        setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m))),
      deleteDish: (id) => {
        setMenu((prev) => prev.filter((m) => m.id !== id));
        setShopping((prev) => prev.filter((s) => s.menu_item_id !== id));
      },
      restoreDish: (row, ingredients) => {
        setMenu((prev) => [...prev.filter((m) => m.id !== row.id), row]);
        setShopping((prev) => [
          ...prev.filter((s) => s.menu_item_id !== row.id),
          ...ingredients,
        ]);
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
      upsertSurvey: (patch) =>
        setSurveys((prev) => {
          const existing = prev.find((s) => s.user_id === ME);
          const row: SurveyRow = {
            user_id: ME,
            activity: "",
            hikes: "",
            wants: "",
            bar_harbor: "",
            food: "",
            ...existing,
            ...patch,
            updated_at: new Date().toISOString(),
          };
          return [...prev.filter((s) => s.user_id !== ME), row];
        }),
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
      restoreGear: (row, children = []) =>
        setGear((prev) => [
          ...prev.filter((g) => g.id !== row.id && !children.some((c) => c.id === g.id)),
          row,
          ...children,
        ]),
      restorePersonal: (row, children = []) =>
        setPersonal((prev) => [
          ...prev.filter((p) => p.id !== row.id && !children.some((c) => c.id === p.id)),
          row,
          ...children,
        ]),
      restoreShopping: (row) =>
        setShopping((prev) => [...prev.filter((s) => s.id !== row.id), row]),
      restoreExpense: (row) =>
        setExpenses((prev) => [...prev.filter((e) => e.id !== row.id), row]),
    };
  }, [name, ensureName, blocks, gear, personal, menu, shopping, expenses, surveys]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <NameSheet open={sheetOpen} onSubmit={submit} onCancel={cancel} />
    </Ctx.Provider>
  );
}
