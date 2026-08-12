"use client";

import { createContext, useContext } from "react";
import type {
  DayPart,
  Expense,
  ExpenseShare,
  ForecastRow,
  GearItem,
  ItineraryBlock,
  ItineraryDay,
  Member,
  MenuItem,
  MenuVote,
  PersonalItem,
  ShoppingItem,
  SurveyRow,
} from "@/lib/types";

export type DayWeather = { high: number; low: number; condition: string };

export type BlockPatch = Partial<
  Pick<ItineraryBlock, "title" | "detail" | "day_part">
>;

export type DishPatch = Partial<
  Pick<MenuItem, "dish" | "meal" | "notes" | "night" | "veg">
>;

export type SurveyPatch = Partial<
  Pick<SurveyRow, "activity" | "hikes" | "wants" | "bar_harbor" | "food">
>;

export type ExpensePatch = Partial<
  Pick<Expense, "description" | "amount_cents" | "payer_id">
>;

export type DataCtx = {
  ready: boolean;
  error: string | null;
  userId: string;
  name: string;
  setName: (n: string) => void;
  /** Name gate: runs the action now when a name is set; otherwise opens the
   *  name bottom sheet and runs the action after Continue. */
  ensureName: (action: () => void) => void;

  profiles: Record<string, string>;
  /** Avatar URL by user id ('' / absent = none — render a monogram). */
  avatars: Record<string, string>;

  /** Everyone on the trip, whether or not they've opened the app. */
  members: Member[];
  /** Your own roster member, or '' if this device hasn't been identified. */
  myMemberId: string;
  /** Which person a device belongs to ('' when unlinked). */
  memberOf: (userId: string | null) => string;
  /** Is this row yours? Compares people, not devices, so your phone and your
   *  laptop agree about what you've claimed. */
  isMe: (userId: string | null) => boolean;
  /** Avatar URL by member id, borrowed from any device they've signed in on. */
  memberAvatars: Record<string, string>;
  addMember: (name: string) => void;
  renameMember: (id: string, name: string) => void;
  deleteMember: (id: string) => void;
  /** Says "this device is that person", and adopts their name. */
  claimMember: (memberId: string) => void;
  /** Downscales client-side, uploads to storage, saves the URL on the profile. */
  setAvatar: (file: File) => void;
  days: ItineraryDay[];
  blocks: ItineraryBlock[];
  gear: GearItem[];
  personal: PersonalItem[];
  menu: MenuItem[];
  shopping: ShoppingItem[];
  expenses: Expense[];
  surveys: SurveyRow[];
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
  /** Batch category/sort rewrite after a drag (rows unchanged are omitted). */
  reorderGear: (rows: { id: string; category: string; sort: number }[]) => void;
  reorderPersonal: (rows: { id: string; category: string; sort: number }[]) => void;
  togglePersonal: (id: string) => void;
  addPersonal: (category: string, label: string) => void;
  deletePersonal: (id: string) => void;
  addDish: (input: {
    night: string;
    meal: string;
    dish: string;
    notes: string;
  }) => string;
  updateDish: (id: string, patch: DishPatch) => void;
  deleteDish: (id: string) => void;
  restoreDish: (row: MenuItem, ingredients: ShoppingItem[]) => void;
  addIngredient: (menuItemId: string, label: string) => void;
  menuVotes: MenuVote[];
  /** Adds or removes your vote for a candidate dish. */
  toggleVote: (menuItemId: string) => void;
  addShopping: (label: string) => void;
  toggleShopping: (id: string) => void;
  deleteShopping: (id: string) => void;
  /** Merges the patch into the caller's own survey row (creating it if absent). */
  upsertSurvey: (patch: SurveyPatch) => void;
  expenseShares: ExpenseShare[];
  /** `among` is the members it's split between — equally, to the cent. */
  addExpense: (
    description: string,
    amountCents: number,
    payerId: string,
    among: string[],
  ) => string;
  updateExpense: (id: string, patch: ExpensePatch) => void;
  setExpenseShares: (expenseId: string, memberIds: string[]) => void;
  deleteExpense: (id: string) => void;
  restoreGear: (row: GearItem, children?: GearItem[]) => void;
  restorePersonal: (row: PersonalItem, children?: PersonalItem[]) => void;
  restoreShopping: (row: ShoppingItem) => void;
  restoreExpense: (row: Expense, among: string[]) => void;
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
