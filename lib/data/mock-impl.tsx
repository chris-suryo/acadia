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
  SEED_INGREDIENTS,
  SEED_MEMBERS,
  SEED_MENU,
  SEED_PERSONAL,
  votableSlot,
} from "@/lib/seeds";
import type {
  Expense,
  ExpenseShare,
  GearClaim,
  GearItem,
  ItineraryBlock,
  Member,
  MenuItem,
  MenuVote,
  PersonalItem,
  PollVote,
  Post,
  PostLike,
  Receipt,
  Settlement,
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
    SEED_MEMBERS.map((n, i) => ({ id: `member-${i}`, name: n, sort: i + 1, venmo: "" })),
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
    const row: Member = { id: newId(), name: clean, sort: nextSort(members), venmo: "" };
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
  // Flat since 0035 — one thing per row, nothing nested.
  const [gear, setGear] = useState<GearItem[]>(() =>
    SEED_GEAR.map((g, i) => ({
      id: `gear-${i}`,
      category: g.category,
      parent_id: null,
      label: g.label,
      sort: g.sort,
      essential: !!g.essential,
    })),
  );
  const [personal, setPersonal] = useState<PersonalItem[]>(() =>
    SEED_PERSONAL.map((p, i) => ({
      id: `mine-${i}`,
      user_id: ME,
      parent_id: null,
      checked: false,
      ...p,
      essential: !!p.essential,
    })),
  );
  // Alana has a tent and so does Chris — the seeded pair that keeps the
  // several-people-per-row path on screen in every run.
  const [gearClaims, setGearClaims] = useState<GearClaim[]>(() => {
    const tents = SEED_GEAR.findIndex((g) => g.label.startsWith("Tents"));
    return tents < 0 ? [] : [{ gear_item_id: `gear-${tents}`, user_id: ALANA }];
  });
  const [menuVotes, setMenuVotes] = useState<MenuVote[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>(() =>
    SEED_MENU.map((m, i) => ({ id: `menu-${i}`, added_by: null, ...m })),
  );
  const [shopping, setShopping] = useState<ShoppingItem[]>(() => {
    const idByDish = new Map(SEED_MENU.map((m, i) => [m.dish, `menu-${i}`]));
    return SEED_INGREDIENTS.map(([dish, label], i) => ({
      id: `ing-${i}`,
      menu_item_id: idByDish.get(dish) ?? null,
      label,
      added_by: null,
      checked: false,
      checked_by: null,
        aisle: "",
    }));
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseShares, setShareRows] = useState<ExpenseShare[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  // Alana's URL is broken on purpose: it 404s against any server, so every
  // screen that shows her face exercises the Avatar fallback — the suite
  // asserts she renders as her initial, never as a broken image.
  const [avatars, setAvatars] = useState<Record<string, string>>({
    [ALANA]: "/no-such-avatar.jpg",
  });
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
  // Two of Alana's chirps keep every feed path on screen in mock runs: a
  // plain one, and a photo post (repo-hosted image — mock can't reach
  // storage) that also arrives pre-hearted so counts render non-zero.
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post-alana-1",
      user_id: ALANA,
      parent_id: null,
      body: "Packing tonight. Who has room for a second cooler?",
      photos: [],
      poll_options: [],
      pinned: false,
      created_at: "2026-08-12T21:00:00Z",
    },
    {
      id: "post-alana-2",
      user_id: ALANA,
      parent_id: null,
      body: "Found the loop map — we're B080 + B082",
      photos: ["/maps/blackwoods-map.png"],
      poll_options: [],
      pinned: false,
      created_at: "2026-08-12T22:30:00Z",
    },
  ]);
  const [postLikes, setPostLikes] = useState<PostLike[]>([
    { post_id: "post-alana-1", user_id: ALANA, emoji: "❤️" },
  ]);
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);

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
      claimedMembers: [myMemberId, alanaMember].filter(Boolean),
      addMember: (n) =>
        setMembers((prev) => [
          ...prev,
          { id: newId(), name: n.trim(), sort: nextSort(prev), venmo: "" },
        ]),
      setMemberVenmo: (id, handle) =>
        setMembers((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, venmo: handle.trim().replace(/^@/, "") } : m,
          ),
        ),
      settlements,
      addSettlement: (fromMember, toMember, cents) =>
        setSettlements((prev) => [
          ...prev,
          {
            id: newId(),
            from_member: fromMember,
            to_member: toMember,
            amount_cents: cents,
            user_id: ME,
            created_at: new Date().toISOString(),
          },
        ]),
      deleteSettlement: (id) => setSettlements((prev) => prev.filter((x) => x.id !== id)),
      restoreSettlement: (row) =>
        setSettlements((prev) => [...prev.filter((x) => x.id !== row.id), row]),
      renameMember: (id, n) =>
        setMembers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, name: n.trim() } : m)),
        ),
      deleteMember: (id) => setMembers((prev) => prev.filter((m) => m.id !== id)),
      restoreMember: (row) =>
        setMembers((prev) => [...prev.filter((m) => m.id !== row.id), row]),
      claimMember,
      expenseShares,
      receipts,
      addReceipt: (expenseId, file) =>
        setReceipts((prev) => [
          ...prev,
          { id: newId(), expense_id: expenseId, url: URL.createObjectURL(file), sort: 0 },
        ]),
      deleteReceipt: (id) => setReceipts((prev) => prev.filter((r) => r.id !== id)),
      setAvatar: (file) =>
        setAvatars((prev) => ({ ...prev, [ME]: URL.createObjectURL(file) })),
      days: SEED_DAYS,
      blocks,
      gear,
      gearClaims,
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
      // Toggles *my* claim, not the row's — two people can both own a tent.
      toggleClaimGear: (id) =>
        setGearClaims((prev) => {
          const item = gear.find((g) => g.id === id);
          if (!item) return prev;
          const ids = item.parent_id
            ? [id]
            : gear.filter((g) => g.id === id || g.parent_id === id).map((g) => g.id);
          const rest = prev.filter(
            (c) => !(ids.includes(c.gear_item_id) && c.user_id === ME),
          );
          const had = prev.some((c) => c.gear_item_id === id && c.user_id === ME);
          return had
            ? rest
            : [...rest, ...ids.map((gid) => ({ gear_item_id: gid, user_id: ME }))];
        }),
      addGear: (category, label) =>
        setGear((prev) => [
          ...prev,
          {
            id: newId(),
            category,
            parent_id: null,
            label,
            sort: nextSort(prev.filter((g) => g.category === category)),
            essential: false,
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
            essential: false,
          },
        ]),
      deletePersonal: (id) =>
        setPersonal((prev) => prev.filter((p) => p.id !== id && p.parent_id !== id)),
      addDish: ({ night, meal, dish, notes }) => {
        const id = newId();
        setMenu((prev) => [
          ...prev,
          {
            id,
            night,
            meal,
            dish,
            notes,
            added_by: ME,
            veg: false,
            votable: votableSlot(night, meal),
            sort: nextSort(prev),
          },
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
          {
            id: newId(),
            menu_item_id: menuItemId,
            label,
            added_by: ME,
            checked: false,
            checked_by: null,
            // Belongs to a dish, so the words decide where it shows.
            aisle: "",
          },
        ]),
      addShopping: (label, aisle = "") =>
        setShopping((prev) => [
          ...prev,
          {
            id: newId(),
            menu_item_id: null,
            label,
            added_by: ME,
            checked: false,
            checked_by: null,
            aisle,
          },
        ]),
      setShoppingChecked: (ids, checked) =>
        setShopping((prev) => {
          const set = new Set(ids);
          return prev.map((s) =>
            set.has(s.id) ? { ...s, checked, checked_by: checked ? ME : null } : s,
          );
        }),
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
      posts,
      postLikes,
      addPost: async (body, files, parentId = null, poll = []) => {
        setPosts((prev) => [
          ...prev,
          {
            id: newId(),
            user_id: ME,
            parent_id: parentId,
            body: body.trim(),
            photos: files.map((f) => URL.createObjectURL(f)),
            poll_options: poll,
            pinned: false,
            created_at: new Date().toISOString(),
          },
        ]);
        return true;
      },
      queuedWrites: 0,
      pollVotes,
      // Tapping your own answer takes it back — mirrors the supabase impl.
      votePoll: (postId, choice) =>
        setPollVotes((prev) => {
          const same = prev.some(
            (v) => v.post_id === postId && v.user_id === ME && v.choice === choice,
          );
          const rest = prev.filter(
            (v) => !(v.post_id === postId && v.user_id === ME),
          );
          return same ? rest : [...rest, { post_id: postId, user_id: ME, choice }];
        }),
      deletePost: (id) =>
        setPosts((prev) => prev.filter((p) => p.id !== id && p.parent_id !== id)),
      // Freshest state inside the updater — the same double-tap guard as votes.
      toggleLikePost: (postId, emoji = "❤️") =>
        setPostLikes((prev) =>
          prev.some(
            (l) => l.post_id === postId && l.user_id === ME && l.emoji === emoji,
          )
            ? prev.filter(
                (l) =>
                  !(l.post_id === postId && l.user_id === ME && l.emoji === emoji),
              )
            : [...prev, { post_id: postId, user_id: ME, emoji }],
        ),
      setPostPinned: (id, pinned) =>
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, pinned } : p))),
    };
  }, [name, ensureName, linkName, claimMember, blocks, gear, personal, menu, menuVotes, shopping, expenses, expenseShares, receipts, settlements, members, myMemberId, surveys, avatars, gearClaims, posts, postLikes, pollVotes]);

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
