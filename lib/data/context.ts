"use client";

import { createContext, useContext, type RefObject } from "react";
import type {
  DayPart,
  Expense,
  ForecastRow,
  GearItem,
  ItineraryBlock,
  ItineraryDay,
  MenuItem,
  PersonalItem,
  ShoppingItem,
} from "@/lib/types";

export type DayWeather = { high: number; low: number; condition: string };

export type BlockPatch = Partial<
  Pick<ItineraryBlock, "title" | "detail" | "day_part">
>;

export type DataCtx = {
  ready: boolean;
  error: string | null;
  userId: string;
  name: string;
  setName: (n: string) => void;
  nameFlash: boolean;
  nameInputRef: RefObject<HTMLInputElement | null>;
  /** Name gate: true when a name is set; otherwise scrolls to the header,
   *  focuses + flashes the name input and returns false. */
  requireName: () => boolean;

  profiles: Record<string, string>;
  days: ItineraryDay[];
  blocks: ItineraryBlock[];
  gear: GearItem[];
  personal: PersonalItem[];
  menu: MenuItem[];
  shopping: ShoppingItem[];
  expenses: Expense[];
  forecast: ForecastRow[];
  weather: Record<string, DayWeather | undefined>; // by day id

  addBlock: (dayId: string, dayPart: DayPart | null, title: string) => string;
  updateBlock: (id: string, patch: BlockPatch) => void;
  deleteBlock: (id: string) => void;
  restoreBlock: (row: ItineraryBlock) => void;
  reorderDay: (rows: { id: string; day_part: DayPart | null; sort: number }[]) => void;
  toggleClaimGear: (id: string) => void;
  addGear: (category: string, label: string) => void;
  deleteGear: (id: string) => void;
  togglePersonal: (id: string) => void;
  addPersonal: (category: string, label: string) => void;
  deletePersonal: (id: string) => void;
  addDish: (input: {
    night: string;
    meal: string;
    dish: string;
    notes: string;
  }) => string;
  deleteDish: (id: string) => void;
  addIngredient: (menuItemId: string, label: string) => void;
  addShopping: (label: string) => void;
  toggleShopping: (id: string) => void;
  deleteShopping: (id: string) => void;
  addExpense: (description: string, amountCents: number) => void;
  deleteExpense: (id: string) => void;
};

export const Ctx = createContext<DataCtx | null>(null);

export function useData(): DataCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData outside DataProvider");
  return v;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}${Date.now()}`;
}

export function nextSort(rows: { sort: number }[]): number {
  return rows.reduce((m, r) => Math.max(m, r.sort), 0) + 1;
}
