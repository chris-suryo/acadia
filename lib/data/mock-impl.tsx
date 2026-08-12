"use client";

// In-memory data engine seeded from lib/seeds — lets the full UI run (and be
// driven by Playwright) in environments that can't reach Supabase. Selected
// with NEXT_PUBLIC_DATA_MODE=mock; never bundled into the deployed flow.

import { useCallback, useMemo, useState } from "react";
import { Ctx, newId, nextSort, type DataCtx, type DayWeather } from "./context";
import { NameSheet, useNameSheet } from "@/components/ui/NameSheet";
import {
  SEED_BLOCKS,
  SEED_DAYS,
  SEED_GEAR,
  SEED_MEMBERS,
  SEED_MENU,
  SEED_PERSONAL,
} from "@/lib/seeds";
import type {
  Expense,
  ExpenseShare,
  GearItem,
  ItineraryBlock,
  Member,
  MenuItem,
  MenuVote,
  PersonalItem,
  ShoppingItem,
  SurveyRow,
} from "@/lib/types";

const ME = "mock-user";
const ALANA = "mock-alana";

const MOCK_WEATHER: Record<string, DayWeather> = {
  fri: { high: 79, low: 57, condition: "Morning shower, then clearing" },
  sat: { high: 77, low: 55, condition: "Partly sunny, clear night" },
  sun: { high: 75, low: 58, condition: "Partly sunny, showers late" },
};

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState("");
  const [members, setMembers] = useState<Member[]>(() =>
    SEED_MEMBERS.map((n, i) => ({ id: `member-${i}`, name: n, sort: i + 1 })),
  );
  // Which roster member this device is. Set by typing a name or tapping one.
  const [myMemberId, setMyMemberId] = useState("");
  // Typing a name that's already on the roster is the same as tapping it — two
  // devices that both say "Chris" are one person, and one person is one column
  // in the settle-up. Defined out here so the name sheet and the context op are
  // the same code; when they weren't, a name typed into the sheet linked nobody.
  const linkName = useCallback((n: string) => {
    setNameState(n);
    const clean = n.trim();
    if (!clean) return;
    const hit = members.find(
      (m) => m.name.trim().toLowerCase() === clean.toLowerCase(),
    );
    if (hit) {
      setMyMemberId(hit.id);
      return;
    }
    const row: Member = { id: newId(), name: clean, sort: nextSort(members) };
    setMembers((prev) => [...prev, row]);
    setMyMemberId(row.id);
  }, [members]);

  const claimMember = useCallback(
    (id: string) => {
      const m = members.find((x) => x.id === id);
      if (!m) return;
      setNameState(m.name);
      setMyMemberId(id);
    },
    [members],
  );

  const { ensureName, sheetOpen, submit, submitMember, cancel } = useNameSheet(
    !!name.trim(),
    linkName,
    claimMember,
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
  const [menuVotes, setMenuVotes] = useState<MenuVote[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>(() =>
    SEED_MENU.map((m, i) => ({ id: `menu-${i}`, added_by: null, ...m })),
  );
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseShares, setShareRows] = useState<ExpenseShare[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [surveys, setSurveys] = useState<SurveyRow[]>([
    // One neighbor's answers so the Ideas board renders populated in mock runs.
    {
      user_id: "mock-alana",
      activity: "One good hike",
      hikes: "Beehive if the ladders aren't crowded",
      wants: "A big hike · Swimming · Hanging at camp",
      bar_harbor: "Done it a bit",
      food: "S'mores. Non-negotiable.",
      updated_at: "2026-08-10T12:00:00Z",
    },
  ]);

  const value = useMemo<DataCtx>(() => {
    const alanaMember = members.find((m) => m.name === "Alana")?.id ?? "";
    const profileMember: Record<string, string> = {
      [ME]: myMemberId,
      [ALANA]: alanaMember,
    };
    const memberOf = (uid: string | null) => (uid ? (profileMember[uid] ?? "") : "");

    return {
      ready: true,
      error: null,
      userId: ME,
      name,
      setName: linkName,
      ensureName,
      profiles: { [ME]: name.trim(), [ALANA]: "Alana" },
      avatars,
      members,
      myMemberId,
      memberOf,
      isMe: (uid) =>
        !!uid && (uid === ME || (!!myMemberId && memberOf(uid) === myMemberId)),
      memberAvatars: Object.fromEntries(
        Object.entries(profileMember)
          .filter(([uid, mid]) => mid && avatars[uid])
          .map(([uid, mid]) => [mid, avatars[uid]]),
      ),
      addMember: (n) =>
        setMembers((prev) => [
          ...prev,
          { id: newId(), name: n.trim(), sort: nextSort(prev) },
        ]),
      renameMember: (id, n) =>
        setMembers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, name: n.trim() } : m)),
        ),
      deleteMember: (id) => setMembers((prev) => prev.filter((m) => m.id !== id)),
      claimMember,
      expenseShares,
      setAvatar: (file) =>
        setAvatars((prev) => ({ ...prev, [ME]: URL.createObjectURL(file) })),
      days: SEED_DAYS,
      blocks,
      gear,
      personal,
      menu,
      menuVotes,
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
          { id, night, meal, dish, notes, added_by: ME, veg: false, sort: nextSort(prev) },
        ]);
        return id;
      },
      // Mirrors the supabase impl: the decision comes from the freshest state
      // inside the updater, so a double tap can't add the same vote twice.
      toggleVote: (menuItemId) =>
        setMenuVotes((prev) =>
          prev.some((v) => v.menu_item_id === menuItemId && v.user_id === ME)
            ? prev.filter((v) => !(v.menu_item_id === menuItemId && v.user_id === ME))
            : [...prev, { menu_item_id: menuItemId, user_id: ME }],
        ),
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
      addExpense: (description, amountCents, payerId, among) => {
        const id = newId();
        setExpenses((prev) => [
          ...prev,
          {
            id,
            user_id: ME,
            payer_id: payerId,
            description,
            amount_cents: amountCents,
            created_at: new Date().toISOString(),
          },
        ]);
        setShareRows((prev) => [
          ...prev,
          ...among.map((member_id) => ({ expense_id: id, member_id })),
        ]);
        return id;
      },
      updateExpense: (id, patch) =>
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
      setExpenseShares: (expenseId, memberIds) =>
        setShareRows((prev) => [
          ...prev.filter((s) => s.expense_id !== expenseId),
          ...memberIds.map((member_id) => ({ expense_id: expenseId, member_id })),
        ]),
      deleteExpense: (id) => {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        setShareRows((prev) => prev.filter((s) => s.expense_id !== id));
      },
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
      restoreExpense: (row, among) => {
        setExpenses((prev) => [...prev.filter((e) => e.id !== row.id), row]);
        setShareRows((prev) => [
          ...prev.filter((s) => s.expense_id !== row.id),
          ...among.map((member_id) => ({ expense_id: row.id, member_id })),
        ]);
      },
    };
  }, [name, ensureName, linkName, claimMember, blocks, gear, personal, menu, menuVotes, shopping, expenses, expenseShares, members, myMemberId, surveys, avatars]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <NameSheet
        open={sheetOpen}
        onSubmit={submit}
        onCancel={cancel}
        roster={members}
        onPick={submitMember}
      />
    </Ctx.Provider>
  );
}
