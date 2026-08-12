"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Ctx, newId, nextSort, type BlockPatch, type DataCtx, type DayWeather, type DishPatch, type SurveyPatch } from "./context";
import { NameSheet, useNameSheet } from "@/components/ui/NameSheet";
import { useUi } from "@/components/ui/UiProvider";
import {
  FORECAST_STALE_MS,
  REALTIME_COALESCE_MS,
  RECEIPT_URL_TTL_S,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  TRIP_DATES,
} from "@/lib/config";
import { downscalePhoto } from "@/lib/avatar";
import { votableSlot } from "@/lib/seeds";
import type {
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
  Profile,
  Receipt,
  Settlement,
  ShoppingItem,
  SurveyRow,
} from "@/lib/types";

const CONFIGURED = SUPABASE_URL.startsWith("https://");

/**
 * Roster order, imposed rather than inherited.
 *
 * `select *` gives no order guarantee, and this array's order is load-bearing:
 * `shares()` hands the odd cents to the first ids in the order the roster is
 * read in, so an unordered read could move a penny between two people between
 * one launch and the next.
 */
const byRosterOrder = (rows: Member[]): Member[] =>
  [...rows].sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));

type Table =
  | "profiles"
  | "members"
  | "itinerary_days"
  | "itinerary_blocks"
  | "gear_items"
  | "personal_items"
  | "menu_items"
  | "menu_votes"
  | "shopping_items"
  | "expenses"
  | "expense_shares"
  | "expense_receipts"
  | "settlements"
  | "survey"
  | "forecast_cache";

const REALTIME_TABLES: Table[] = [
  "profiles",
  "members",
  "itinerary_blocks",
  "gear_items",
  "menu_items",
  "menu_votes",
  "shopping_items",
  "expenses",
  "expense_shares",
  "expense_receipts",
  "settlements",
  "survey",
  "forecast_cache",
];

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(
    () =>
      createClient(
        CONFIGURED ? SUPABASE_URL : "https://placeholder.supabase.co",
        CONFIGURED ? SUPABASE_ANON_KEY : "placeholder",
      ),
    [],
  );

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(
    CONFIGURED ? null : "Backend not configured.",
  );
  const [userId, setUserId] = useState("");
  const userIdRef = useRef("");
  const [name, setNameState] = useState("");
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [profileRows, setProfileRows] = useState<Profile[]>([]);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [blocks, setBlocks] = useState<ItineraryBlock[]>([]);
  const [gear, setGear] = useState<GearItem[]>([]);
  const [personal, setPersonal] = useState<PersonalItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuVotes, setMenuVotes] = useState<MenuVote[]>([]);
  const votesRef = useRef<MenuVote[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseShares, setShareRows] = useState<ExpenseShare[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  // Rows carry the storage *path*; the bucket is private, so the link a browser
  // can actually load is signed below and cached by path.
  const [receiptRows, setReceiptRows] = useState<Receipt[]>([]);
  const [signedReceipts, setSignedReceipts] = useState<Record<string, string>>({});
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [forecast, setForecast] = useState<ForecastRow[]>([]);

  // Blackwoods has almost no signal, so every successful read is mirrored to
  // localStorage and replayed on boot — the app opens with the last sync
  // instead of an empty shell.
  const cacheKey = (t: Table) => `abc.cache.${t}`;

  const applyRows = useCallback((table: Table, data: unknown[]) => {
    switch (table) {
        case "profiles":
          setProfileRows(data as Profile[]);
          break;
        case "itinerary_days":
          setDays(data as ItineraryDay[]);
          break;
        case "itinerary_blocks":
          setBlocks(data as ItineraryBlock[]);
          break;
        case "gear_items":
          setGear(data as GearItem[]);
          break;
        case "personal_items":
          setPersonal(data as PersonalItem[]);
          break;
        case "menu_items":
          setMenu(data as MenuItem[]);
          break;
        case "menu_votes":
          setMenuVotes(data as MenuVote[]);
          break;
        case "shopping_items":
          setShopping(data as ShoppingItem[]);
          break;
        case "expenses":
          setExpenses(data as Expense[]);
          break;
        case "expense_shares":
          setShareRows(data as ExpenseShare[]);
          break;
        case "members":
          setMembers(byRosterOrder(data as Member[]));
          break;
        case "expense_receipts":
          setReceiptRows(data as Receipt[]);
          break;
        case "settlements":
          setSettlements(data as Settlement[]);
          break;
        case "survey":
          setSurveys(data as SurveyRow[]);
          break;
        case "forecast_cache":
          setForecast(data as ForecastRow[]);
          break;
      }
    },
    [],
  );

  const refetch = useCallback(
    async (table: Table) => {
      const { data, error: err } = await supabase.from(table).select("*");
      if (err || !data) return;
      applyRows(table, data);
      try {
        localStorage.setItem(cacheKey(table), JSON.stringify(data));
      } catch {
        // Quota or private mode — losing the offline copy is survivable.
      }
    },
    [supabase, applyRows],
  );

  // Fire a write; on failure, notify, log, and re-sync the table so the
  // optimistic change reverts.
  const { showNotice } = useUi();
  // toggleVote reads this instead of its render closure, so two quick taps
  // can't both decide "not voted yet" and both insert.
  useEffect(() => {
    votesRef.current = menuVotes;
  }, [menuVotes]);

  const persist = useCallback(
    (write: PromiseLike<{ error: unknown }>, table: Table) => {
      const fail = (err: unknown) => {
        console.error(`[${table}]`, err);
        showNotice("Couldn't save — retry");
        refetch(table);
      };
      Promise.resolve(write).then(({ error: err }) => {
        if (err) fail(err);
      }, fail);
    },
    [refetch, showNotice],
  );

  useEffect(() => {
    if (!CONFIGURED) return;
    let cancelled = false;

    // Paint the last sync first — offline this is all there is, and online it
    // just beats the network.
    const CACHED: Table[] = [
      "profiles",
      "members",
      "itinerary_days",
      "itinerary_blocks",
      "gear_items",
      "personal_items",
      "menu_items",
      "menu_votes",
      "shopping_items",
      "expenses",
      "expense_shares",
      "expense_receipts",
      "settlements",
      "survey",
      "forecast_cache",
    ];
    const cached: [Table, unknown[]][] = [];
    for (const table of CACHED) {
      try {
        const raw = localStorage.getItem(`abc.cache.${table}`);
        if (!raw) continue;
        const rows = JSON.parse(raw);
        if (Array.isArray(rows) && rows.length) cached.push([table, rows]);
      } catch {
        // Corrupt entry — the network refetch below replaces it.
      }
    }
    const hadCache = cached.length > 0;
    const hydrate = setTimeout(() => {
      for (const [table, rows] of cached) applyRows(table, rows);
      setReady(true);
    }, 0);

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let s = session;
      if (!s) {
        const { data, error: err } = await supabase.auth.signInAnonymously();
        if (err || !data.session) {
          if (cancelled) return;
          // With a cached copy the app stays usable; without one there's
          // nothing to show.
          if (hadCache) showNotice("Offline — showing your last sync");
          else setError("Sign-in unavailable.");
          return;
        }
        s = data.session;
      }
      if (cancelled) return;
      const uid = s.user.id;
      userIdRef.current = uid;
      setUserId(uid);

      await supabase
        .from("profiles")
        .upsert({ id: uid }, { onConflict: "id", ignoreDuplicates: true });
      await supabase.rpc("seed_personal_items");

      await Promise.all([
        refetch("profiles"),
        refetch("itinerary_days"),
        refetch("itinerary_blocks"),
        refetch("gear_items"),
        refetch("personal_items"),
        refetch("menu_items"),
        refetch("menu_votes"),
        refetch("shopping_items"),
        refetch("expenses"),
        refetch("expense_shares"),
        refetch("expense_receipts"),
        refetch("settlements"),
        refetch("members"),
        refetch("survey"),
      ]);
      if (cancelled) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", uid)
        .maybeSingle();
      if (!cancelled && prof?.name) setNameState(prof.name);

      setReady(true);

      // Weather: read cache; refresh via the edge function only when stale.
      const { data: fc } = await supabase.from("forecast_cache").select("*");
      const rows = (fc ?? []) as ForecastRow[];
      if (!cancelled) setForecast(rows);
      const dates = Object.keys(TRIP_DATES);
      const have = rows.filter((r) => dates.includes(r.date_key));
      const fresh =
        have.length === dates.length &&
        have.every(
          (r) => Date.now() - new Date(r.fetched_at).getTime() < FORECAST_STALE_MS,
        );
      if (!fresh) {
        try {
          await supabase.functions.invoke("weather");
          await refetch("forecast_cache");
        } catch (e) {
          console.warn("weather refresh failed", e);
        }
      }
    })();

    // One change is one event, and a batched write is one event per row —
    // refetching the whole table on each would multiply somebody else's drag
    // into a burst of full-table reads on every phone at the campsite.
    // Collect what changed and read each table once on a trailing timer.
    const dirty = new Set<Table>();
    let flush: ReturnType<typeof setTimeout> | null = null;
    const markDirty = (table: Table) => {
      dirty.add(table);
      if (flush) return;
      flush = setTimeout(() => {
        flush = null;
        const tables = [...dirty];
        dirty.clear();
        for (const t of tables) refetch(t);
      }, REALTIME_COALESCE_MS);
    };

    const channel = supabase.channel("db-sync");
    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => markDirty(table),
      );
    }
    channel.subscribe();

    return () => {
      cancelled = true;
      clearTimeout(hydrate);
      if (flush) clearTimeout(flush);
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch, applyRows, showNotice]);

  // Handlers decide things from this, not from whatever the last render
  // captured — the same mistake that lost a round of menu votes.
  const membersRef = useRef<Member[]>([]);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  /** Overwrite this device's profile row in place, keeping untouched fields. */
  const patchMyProfile = useCallback(
    (uid: string, patch: Partial<Profile>) => {
      setProfileRows((prev) => {
        const me = prev.find((p) => p.id === uid);
        return [
          ...prev.filter((p) => p.id !== uid),
          {
            id: uid,
            name: me?.name ?? "",
            avatar_url: me?.avatar_url ?? "",
            member_id: me?.member_id ?? null,
            ...patch,
          },
        ];
      });
    },
    [],
  );

  const setName = useCallback(
    (n: string) => {
      setNameState(n);
      const uid = userIdRef.current;
      if (!uid) return;
      const clean = n.trim();
      patchMyProfile(uid, { name: clean });
      if (nameTimer.current) clearTimeout(nameTimer.current);
      nameTimer.current = setTimeout(() => {
        // Typing a name already on the roster is the same as tapping it: two
        // devices that both say "Chris" are one person, and one person is one
        // column in the settle-up.
        const hit = membersRef.current.find(
          (m) => m.name.trim().toLowerCase() === clean.toLowerCase(),
        );
        (async () => {
          let memberId = hit?.id ?? "";
          if (!hit && clean) {
            memberId = newId();
            const { error: err } = await supabase
              .from("members")
              .insert({ id: memberId, name: clean, sort: nextSort(membersRef.current) });
            if (err) throw err;
            refetch("members");
          }
          if (memberId) patchMyProfile(uid, { member_id: memberId });
          const { error: err } = await supabase
            .from("profiles")
            .upsert({ id: uid, name: clean, ...(memberId ? { member_id: memberId } : {}) });
          if (err) throw err;
        })().catch((err) => {
          console.error("[profiles]", err);
          showNotice("Couldn't save — retry");
          refetch("profiles");
        });
      }, 500);
    },
    [supabase, patchMyProfile, refetch, showNotice],
  );

  /** "I'm that one." Adopts the member's name so the header matches. */
  const claimMember = useCallback(
    (memberId: string) => {
      const m = membersRef.current.find((x) => x.id === memberId);
      const uid = userIdRef.current;
      if (!m || !uid) return;
      // Cancel any debounced name write, or it lands after this and unlinks us.
      if (nameTimer.current) clearTimeout(nameTimer.current);
      setNameState(m.name);
      patchMyProfile(uid, { name: m.name, member_id: memberId });
      persist(
        supabase
          .from("profiles")
          .upsert({ id: uid, name: m.name, member_id: memberId }),
        "profiles",
      );
    },
    [supabase, patchMyProfile, persist],
  );

  const { ensureName, sheetOpen, submit, submitMember, cancel } = useNameSheet(
    !!name.trim(),
    setName,
    claimMember,
  );

  const profiles = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of profileRows) m[p.id] = p.name;
    return m;
  }, [profileRows]);

  const avatars = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of profileRows) if (p.avatar_url) m[p.id] = p.avatar_url;
    return m;
  }, [profileRows]);

  // Device → person. Everything that used to ask "is this row mine?" by
  // comparing user ids asks this instead, so a second phone isn't a stranger.
  const profileMember = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of profileRows) if (p.member_id) m[p.id] = p.member_id;
    return m;
  }, [profileRows]);

  const myMemberId = profileMember[userId] ?? "";

  const memberOf = useCallback(
    (uid: string | null) => (uid ? (profileMember[uid] ?? "") : ""),
    [profileMember],
  );

  const isMe = useCallback(
    (uid: string | null) => {
      if (!uid) return false;
      if (uid === userId) return true;
      const mine = profileMember[userId];
      return !!mine && profileMember[uid] === mine;
    },
    [profileMember, userId],
  );

  // A member has no picture of their own — they borrow one from whichever of
  // their devices has uploaded it.
  const memberAvatars = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of profileRows)
      if (p.member_id && p.avatar_url && !m[p.member_id]) m[p.member_id] = p.avatar_url;
    return m;
  }, [profileRows]);

  /** `persist` for an expense written across its two tables at once. */
  const writeBoth = useCallback(
    (work: Promise<void>) => {
      work.catch((err) => {
        console.error("[expenses]", err);
        showNotice("Couldn't save — retry");
        refetch("expenses");
        refetch("expense_shares");
      });
    },
    [refetch, showNotice],
  );

  // Which names are spoken for. Drives the picker: a name already on a phone
  // reads as taken instead of looking exactly like a free one.
  const claimedMembers = useMemo(
    () => [...new Set(profileRows.map((p) => p.member_id).filter((x): x is string => !!x))],
    [profileRows],
  );

  const addMember = useCallback(
    (name: string) => {
      const row: Member = {
        id: newId(),
        name: name.trim(),
        sort: nextSort(membersRef.current),
        venmo: "",
      };
      setMembers((prev) => byRosterOrder([...prev, row]));
      persist(supabase.from("members").insert(row), "members");
    },
    [supabase, persist],
  );

  const renameMember = useCallback(
    (id: string, name: string) => {
      const clean = name.trim();
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, name: clean } : m)));
      persist(supabase.from("members").update({ name: clean }).eq("id", id), "members");
    },
    [supabase, persist],
  );

  const setMemberVenmo = useCallback(
    (id: string, handle: string) => {
      // Stored bare; the @ and the URL are presentation.
      const clean = handle.trim().replace(/^@/, "");
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, venmo: clean } : m)));
      persist(supabase.from("members").update({ venmo: clean }).eq("id", id), "members");
    },
    [supabase, persist],
  );

  const addSettlement = useCallback(
    (fromMember: string, toMember: string, cents: number) => {
      const row: Settlement = {
        id: newId(),
        from_member: fromMember,
        to_member: toMember,
        amount_cents: cents,
        user_id: userIdRef.current || null,
        created_at: new Date().toISOString(),
      };
      setSettlements((prev) => [...prev, row]);
      persist(supabase.from("settlements").insert(row), "settlements");
    },
    [supabase, persist],
  );

  const deleteSettlement = useCallback(
    (id: string) => {
      setSettlements((prev) => prev.filter((x) => x.id !== id));
      persist(supabase.from("settlements").delete().eq("id", id), "settlements");
    },
    [supabase, persist],
  );

  const restoreSettlement = useCallback(
    (row: Settlement) => {
      setSettlements((prev) => [...prev.filter((x) => x.id !== row.id), row]);
      persist(supabase.from("settlements").upsert(row), "settlements");
    },
    [supabase, persist],
  );

  const deleteMember = useCallback(
    (id: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      persist(supabase.from("members").delete().eq("id", id), "members");
    },
    [supabase, persist],
  );

  const restoreMember = useCallback(
    (row: Member) => {
      setMembers((prev) => byRosterOrder([...prev.filter((m) => m.id !== row.id), row]));
      persist(supabase.from("members").upsert(row), "members");
    },
    [supabase, persist],
  );

  const addReceipt = useCallback(
    (expenseId: string, file: File) => {
      const id = newId();
      (async () => {
        // Downscaled on the phone: a 12MP camera shot over campground signal
        // either takes a minute or never lands.
        const blob = await downscalePhoto(file);
        const path = `${expenseId}/${id}.jpg`;
        const { error: err } = await supabase.storage
          .from("receipts")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (err) throw err;
        // The path, not a URL: the bucket is private, and a signed link would
        // be stale long before the row is.
        const { error: rerr } = await supabase
          .from("expense_receipts")
          .insert({ id, expense_id: expenseId, url: path, sort: 0 });
        if (rerr) throw rerr;
        refetch("expense_receipts");
      })().catch((e) => {
        console.error("[receipt]", e);
        showNotice("Couldn't add that photo — retry");
        refetch("expense_receipts");
      });
    },
    [supabase, refetch, showNotice],
  );

  const deleteReceipt = useCallback(
    (id: string) => {
      setReceiptRows((prev) => prev.filter((r) => r.id !== id));
      // The object stays in the bucket; it's a few KB and orphaned storage is
      // cheaper than a delete that half-succeeds.
      persist(supabase.from("expense_receipts").delete().eq("id", id), "expense_receipts");
    },
    [supabase, persist],
  );

  const setAvatar = useCallback(
    (file: File) => {
      const uid = userIdRef.current;
      if (!uid) return;
      (async () => {
        // Already a square JPEG at the display size — re-encoding it here only
        // spent a second lossy pass on the same pixels.
        const blob = file;
        const path = `${uid}.jpg`;
        const { error: err } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (err) throw err;
        // Deterministic public URL; the version param busts caches on re-upload.
        const url = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?v=${new Date().getTime()}`;
        patchMyProfile(uid, { avatar_url: url });
        const { error: perr } = await supabase
          .from("profiles")
          .upsert({ id: uid, avatar_url: url });
        if (perr) throw perr;
      })().catch((e) => {
        console.error("[avatar]", e);
        showNotice("Couldn't save photo — retry");
        refetch("profiles");
      });
    },
    [supabase, showNotice, refetch, patchMyProfile],
  );

  /** An already-absolute link — a legacy public URL, or a mock blob. */
  const isAbsolute = (u: string) => u.includes("://");

  // Sign whatever hasn't been signed yet, in one request. Signatures are held
  // by path, so a re-read of the table doesn't re-sign what's already good.
  useEffect(() => {
    const paths = [
      ...new Set(
        receiptRows.map((r) => r.url).filter((u) => u && !isAbsolute(u)),
      ),
    ].filter((p) => !signedReceipts[p]);
    if (!paths.length) return;
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase.storage
        .from("receipts")
        .createSignedUrls(paths, RECEIPT_URL_TTL_S);
      if (err || !data || cancelled) return;
      const next: Record<string, string> = {};
      for (const row of data) if (row.path && row.signedUrl) next[row.path] = row.signedUrl;
      if (Object.keys(next).length) setSignedReceipts((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [receiptRows, signedReceipts, supabase]);

  // What the UI renders: the same rows, with `url` resolved to something a
  // browser can load. A row waits here until its signature lands rather than
  // rendering a broken thumbnail.
  const receipts = useMemo(
    () =>
      receiptRows
        .map((r) => (isAbsolute(r.url) ? r : { ...r, url: signedReceipts[r.url] ?? "" }))
        .filter((r) => r.url),
    [receiptRows, signedReceipts],
  );

  const weather = useMemo(() => {
    const m: Record<string, DayWeather | undefined> = {};
    for (const r of forecast) {
      const day = TRIP_DATES[r.date_key];
      if (day && r.high != null && r.low != null)
        m[day] = { high: r.high, low: r.low, condition: r.condition ?? "" };
    }
    return m;
  }, [forecast]);

  const value: DataCtx = {
    ready,
    error,
    userId,
    name,
    setName,
    ensureName,
    profiles,
    avatars,
    members,
    myMemberId,
    memberOf,
    isMe,
    memberAvatars,
    claimedMembers,
    addMember,
    renameMember,
    setMemberVenmo,
    deleteMember,
    settlements,
    addSettlement,
    deleteSettlement,
    restoreSettlement,
    restoreMember,
    claimMember,
    expenseShares,
    receipts,
    addReceipt,
    deleteReceipt,
    setAvatar,
    days,
    blocks,
    gear,
    personal,
    menu,
    menuVotes,
    shopping,
    expenses,
    surveys,
    forecast,
    weather,

    addBlock: (dayId, dayPart, title) => {
      const row: ItineraryBlock = {
        id: newId(),
        day_id: dayId,
        title,
        detail: "",
        day_part: dayPart,
        link_slug: null,
        sort: nextSort(blocks.filter((b) => b.day_id === dayId)),
      };
      setBlocks((prev) => [...prev, row]);
      persist(supabase.from("itinerary_blocks").insert(row), "itinerary_blocks");
      return row.id;
    },

    updateBlock: (id, patch: BlockPatch) => {
      setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
      persist(
        supabase.from("itinerary_blocks").update(patch).eq("id", id),
        "itinerary_blocks",
      );
    },

    deleteBlock: (id) => {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      persist(supabase.from("itinerary_blocks").delete().eq("id", id), "itinerary_blocks");
    },

    restoreBlock: (row) => {
      setBlocks((prev) => [...prev.filter((b) => b.id !== row.id), row]);
      persist(supabase.from("itinerary_blocks").upsert(row), "itinerary_blocks");
    },

    reorderDay: (rows) => {
      const byId = new Map(rows.map((r) => [r.id, r]));
      const next = blocks.map((b) => {
        const r = byId.get(b.id);
        return r ? { ...b, day_part: r.day_part, sort: r.sort } : b;
      });
      setBlocks(next);
      // One request for the whole drag. This was a round trip per row, which
      // on campground signal is the difference between a reorder that lands
      // and one that hangs halfway through with the list half-rewritten.
      persist(
        supabase.from("itinerary_blocks").upsert(next.filter((b) => byId.has(b.id))),
        "itinerary_blocks",
      );
    },

    toggleClaimGear: (id) => {
      const item = gear.find((g) => g.id === id);
      if (!item) return;
      const owner = item.owner_id ? null : userIdRef.current;
      // Claiming a parent claims the whole bundle.
      const ids = item.parent_id
        ? [id]
        : gear.filter((g) => g.id === id || g.parent_id === id).map((g) => g.id);
      setGear((prev) =>
        prev.map((g) => (ids.includes(g.id) ? { ...g, owner_id: owner } : g)),
      );
      persist(
        supabase.from("gear_items").update({ owner_id: owner }).in("id", ids),
        "gear_items",
      );
    },

    addGear: (category, label) => {
      const row = {
        id: newId(),
        category,
        parent_id: null,
        label,
        owner_id: null,
        sort: nextSort(gear.filter((g) => g.category === category)),
        // Matches the column default — the fourteen are set in migration 0024,
        // and anything typed in afterwards is the group's own addition.
        essential: false,
      };
      setGear((prev) => [...prev, row]);
      persist(supabase.from("gear_items").insert(row), "gear_items");
    },

    deleteGear: (id) => {
      setGear((prev) => prev.filter((g) => g.id !== id && g.parent_id !== id));
      persist(supabase.from("gear_items").delete().eq("id", id), "gear_items");
    },

    reorderGear: (rows) => {
      const byId = new Map(rows.map((r) => [r.id, r]));
      const next = gear.map((g) => {
        const r = byId.get(g.id);
        return r ? { ...g, category: r.category, sort: r.sort } : g;
      });
      setGear(next);
      persist(
        supabase.from("gear_items").upsert(next.filter((g) => byId.has(g.id))),
        "gear_items",
      );
    },

    reorderPersonal: (rows) => {
      const byId = new Map(rows.map((r) => [r.id, r]));
      const next = personal.map((p) => {
        const r = byId.get(p.id);
        return r ? { ...p, category: r.category, sort: r.sort } : p;
      });
      setPersonal(next);
      persist(
        supabase.from("personal_items").upsert(next.filter((p) => byId.has(p.id))),
        "personal_items",
      );
    },

    togglePersonal: (id) => {
      const item = personal.find((p) => p.id === id);
      if (!item) return;
      const checked = !item.checked;
      // A parent checkbox checks/unchecks its children.
      const ids = item.parent_id
        ? [id]
        : personal.filter((p) => p.id === id || p.parent_id === id).map((p) => p.id);
      setPersonal((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, checked } : p)),
      );
      persist(
        supabase.from("personal_items").update({ checked }).in("id", ids),
        "personal_items",
      );
    },

    addPersonal: (category, label) => {
      const row = {
        id: newId(),
        user_id: userIdRef.current,
        category,
        parent_id: null,
        label,
        note: "",
        checked: false,
        sort: nextSort(personal.filter((p) => p.category === category)),
        essential: false,
      };
      setPersonal((prev) => [...prev, row]);
      persist(supabase.from("personal_items").insert(row), "personal_items");
    },

    deletePersonal: (id) => {
      setPersonal((prev) => prev.filter((p) => p.id !== id && p.parent_id !== id));
      persist(supabase.from("personal_items").delete().eq("id", id), "personal_items");
    },

    toggleVote: (menuItemId) => {
      const uid = userIdRef.current;
      if (!uid) return;
      // Read the ref, not the render closure. Two quick taps — or one queued
      // behind the name sheet — used to both read "not voted yet" and both
      // INSERT, and the second collided with the composite primary key. That
      // surfaced as "Couldn't save — retry" and the recovery refetch threw the
      // vote away.
      const has = votesRef.current.some(
        (v) => v.menu_item_id === menuItemId && v.user_id === uid,
      );
      // Optimistic: a vote should land under your thumb, not after a round trip.
      setMenuVotes((prev) =>
        has
          ? prev.filter((v) => !(v.menu_item_id === menuItemId && v.user_id === uid))
          : prev.some((v) => v.menu_item_id === menuItemId && v.user_id === uid)
            ? prev
            : [...prev, { menu_item_id: menuItemId, user_id: uid }],
      );
      persist(
        has
          ? supabase
              .from("menu_votes")
              .delete()
              .eq("menu_item_id", menuItemId)
              .eq("user_id", uid)
          : // Idempotent by design: if the row is somehow already there, this
            // is a no-op instead of a red banner.
            supabase.from("menu_votes").upsert(
              { menu_item_id: menuItemId, user_id: uid },
              { onConflict: "menu_item_id,user_id", ignoreDuplicates: true },
            ),
        "menu_votes",
      );
    },

    addDish: ({ night, meal, dish, notes }) => {
      const row = {
        id: newId(),
        night,
        meal,
        dish,
        notes,
        added_by: userIdRef.current,
        veg: false,
        votable: votableSlot(night, meal),
        sort: nextSort(menu),
      };
      setMenu((prev) => [...prev, row]);
      persist(supabase.from("menu_items").insert(row), "menu_items");
      return row.id;
    },

    updateDish: (id, patch: DishPatch) => {
      setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
      persist(supabase.from("menu_items").update(patch).eq("id", id), "menu_items");
    },

    deleteDish: (id) => {
      setMenu((prev) => prev.filter((m) => m.id !== id));
      setShopping((prev) => prev.filter((s) => s.menu_item_id !== id));
      persist(supabase.from("menu_items").delete().eq("id", id), "menu_items");
    },

    restoreDish: (row, ingredients) => {
      setMenu((prev) => [...prev.filter((m) => m.id !== row.id), row]);
      setShopping((prev) => [
        ...prev.filter((s) => s.menu_item_id !== row.id),
        ...ingredients,
      ]);
      (async () => {
        await supabase.from("menu_items").upsert(row);
        if (ingredients.length)
          await supabase.from("shopping_items").upsert(ingredients);
        refetch("menu_items");
        refetch("shopping_items");
      })().catch((e) => {
        console.error(e);
        refetch("menu_items");
        refetch("shopping_items");
      });
    },

    addIngredient: (menuItemId, label) => {
      const row = {
        id: newId(),
        menu_item_id: menuItemId,
        label,
        added_by: userIdRef.current,
        checked: false,
        checked_by: null,
        aisle: "",
      };
      setShopping((prev) => [...prev, row]);
      persist(supabase.from("shopping_items").insert(row), "shopping_items");
    },

    addShopping: (label, aisle = "") => {
      const row = {
        id: newId(),
        menu_item_id: null,
        label,
        added_by: userIdRef.current,
        checked: false,
        checked_by: null,
        aisle,
      };
      setShopping((prev) => [...prev, row]);
      persist(supabase.from("shopping_items").insert(row), "shopping_items");
    },

    toggleShopping: (id) => {
      const item = shopping.find((s) => s.id === id);
      if (!item) return;
      const checked = !item.checked;
      const checked_by = checked ? userIdRef.current : null;
      setShopping((prev) =>
        prev.map((s) => (s.id === id ? { ...s, checked, checked_by } : s)),
      );
      persist(
        supabase.from("shopping_items").update({ checked, checked_by }).eq("id", id),
        "shopping_items",
      );
    },

    deleteShopping: (id) => {
      setShopping((prev) => prev.filter((s) => s.id !== id));
      persist(supabase.from("shopping_items").delete().eq("id", id), "shopping_items");
    },

    upsertSurvey: (patch: SurveyPatch) => {
      const uid = userIdRef.current;
      if (!uid) return;
      // Merge into the full row so the optimistic state and the upsert agree.
      const existing = surveys.find((s) => s.user_id === uid);
      const row: SurveyRow = {
        user_id: uid,
        activity: "",
        hikes: "",
        wants: "",
        bar_harbor: "",
        food: "",
        ...existing,
        ...patch,
        updated_at: new Date().toISOString(),
      };
      setSurveys((prev) => [...prev.filter((s) => s.user_id !== uid), row]);
      persist(supabase.from("survey").upsert(row), "survey");
    },

    addExpense: (description, amountCents, payerId, among) => {
      const id = newId();
      const row: Expense = {
        id,
        user_id: userIdRef.current,
        payer_id: payerId,
        description,
        amount_cents: amountCents,
        created_at: new Date().toISOString(),
      };
      setExpenses((prev) => [...prev, row]);
      setShareRows((prev) => [
        ...prev,
        ...among.map((member_id) => ({ expense_id: id, member_id })),
      ]);
      // Two writes, one thing: an expense whose shares didn't land would quietly
      // charge nobody, so a failure on either half re-reads both.
      writeBoth(
        (async () => {
          const { error: e1 } = await supabase.from("expenses").insert({
            id,
            user_id: row.user_id,
            payer_id: payerId,
            description,
            amount_cents: amountCents,
          });
          if (e1) throw e1;
          if (among.length) {
            const { error: e2 } = await supabase
              .from("expense_shares")
              .insert(among.map((member_id) => ({ expense_id: id, member_id })));
            if (e2) throw e2;
          }
        })(),
      );
      return id;
    },

    updateExpense: (id, patch) => {
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      persist(supabase.from("expenses").update(patch).eq("id", id), "expenses");
    },

    setExpenseShares: (expenseId, memberIds) => {
      setShareRows((prev) => [
        ...prev.filter((s) => s.expense_id !== expenseId),
        ...memberIds.map((member_id) => ({ expense_id: expenseId, member_id })),
      ]);
      writeBoth(
        (async () => {
          const { error: e1 } = await supabase
            .from("expense_shares")
            .delete()
            .eq("expense_id", expenseId);
          if (e1) throw e1;
          if (memberIds.length) {
            const { error: e2 } = await supabase
              .from("expense_shares")
              .insert(memberIds.map((member_id) => ({ expense_id: expenseId, member_id })));
            if (e2) throw e2;
          }
        })(),
      );
    },

    deleteExpense: (id) => {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setShareRows((prev) => prev.filter((s) => s.expense_id !== id));
      // The shares go with it — `on delete cascade` on the far side.
      persist(supabase.from("expenses").delete().eq("id", id), "expenses");
    },

    restoreGear: (row, children = []) => {
      setGear((prev) => [
        ...prev.filter((g) => g.id !== row.id && !children.some((c) => c.id === g.id)),
        row,
        ...children,
      ]);
      (async () => {
        await supabase.from("gear_items").upsert(row);
        if (children.length) await supabase.from("gear_items").upsert(children);
        refetch("gear_items");
      })().catch((e) => {
        console.error(e);
        refetch("gear_items");
      });
    },

    restorePersonal: (row, children = []) => {
      setPersonal((prev) => [
        ...prev.filter((p) => p.id !== row.id && !children.some((c) => c.id === p.id)),
        row,
        ...children,
      ]);
      (async () => {
        await supabase.from("personal_items").upsert(row);
        if (children.length) await supabase.from("personal_items").upsert(children);
        refetch("personal_items");
      })().catch((e) => {
        console.error(e);
        refetch("personal_items");
      });
    },

    restoreShopping: (row) => {
      setShopping((prev) => [...prev.filter((s) => s.id !== row.id), row]);
      persist(supabase.from("shopping_items").upsert(row), "shopping_items");
    },

    restoreExpense: (row, among) => {
      setExpenses((prev) => [...prev.filter((e) => e.id !== row.id), row]);
      setShareRows((prev) => [
        ...prev.filter((s) => s.expense_id !== row.id),
        ...among.map((member_id) => ({ expense_id: row.id, member_id })),
      ]);
      writeBoth(
        (async () => {
          const { error: e1 } = await supabase.from("expenses").upsert({
            id: row.id,
            user_id: row.user_id,
            payer_id: row.payer_id,
            description: row.description,
            amount_cents: row.amount_cents,
            created_at: row.created_at,
          });
          if (e1) throw e1;
          if (among.length) {
            const { error: e2 } = await supabase
              .from("expense_shares")
              .upsert(among.map((member_id) => ({ expense_id: row.id, member_id })));
            if (e2) throw e2;
          }
        })(),
      );
    },
  };

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
