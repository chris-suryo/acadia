"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Ctx, newId, nextSort, type BlockPatch, type DataCtx, type DayWeather, type DishPatch, type SurveyPatch } from "./context";
import { NameSheet, useNameSheet } from "@/components/ui/NameSheet";
import { useUi } from "@/components/ui/UiProvider";
import {
  FORECAST_STALE_MS,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  TRIP_DATES,
} from "@/lib/config";
import { downscaleAvatar } from "@/lib/avatar";
import type {
  Expense,
  ForecastRow,
  GearItem,
  ItineraryBlock,
  ItineraryDay,
  MenuItem,
  PersonalItem,
  Profile,
  ShoppingItem,
  SurveyRow,
} from "@/lib/types";

const CONFIGURED = SUPABASE_URL.startsWith("https://");

type Table =
  | "profiles"
  | "itinerary_days"
  | "itinerary_blocks"
  | "gear_items"
  | "personal_items"
  | "menu_items"
  | "shopping_items"
  | "expenses"
  | "survey"
  | "forecast_cache";

const REALTIME_TABLES: Table[] = [
  "profiles",
  "itinerary_blocks",
  "gear_items",
  "menu_items",
  "shopping_items",
  "expenses",
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
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [forecast, setForecast] = useState<ForecastRow[]>([]);

  const refetch = useCallback(
    async (table: Table) => {
      const { data, error: err } = await supabase.from(table).select("*");
      if (err || !data) return;
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
        case "shopping_items":
          setShopping(data as ShoppingItem[]);
          break;
        case "expenses":
          setExpenses(data as Expense[]);
          break;
        case "survey":
          setSurveys(data as SurveyRow[]);
          break;
        case "forecast_cache":
          setForecast(data as ForecastRow[]);
          break;
      }
    },
    [supabase],
  );

  // Fire a write; on failure, notify, log, and re-sync the table so the
  // optimistic change reverts.
  const { showNotice } = useUi();
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

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let s = session;
      if (!s) {
        const { data, error: err } = await supabase.auth.signInAnonymously();
        if (err || !data.session) {
          if (!cancelled) setError("Sign-in unavailable.");
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
        refetch("shopping_items"),
        refetch("expenses"),
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

    const channel = supabase.channel("db-sync");
    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => refetch(table),
      );
    }
    channel.subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch]);

  const setName = useCallback(
    (n: string) => {
      setNameState(n);
      const uid = userIdRef.current;
      if (!uid) return;
      setProfileRows((prev) => {
        const rest = prev.filter((p) => p.id !== uid);
        const me = prev.find((p) => p.id === uid);
        return [...rest, { id: uid, name: n.trim(), avatar_url: me?.avatar_url ?? "" }];
      });
      if (nameTimer.current) clearTimeout(nameTimer.current);
      nameTimer.current = setTimeout(() => {
        persist(
          supabase.from("profiles").upsert({ id: uid, name: n.trim() }),
          "profiles",
        );
      }, 500);
    },
    [supabase, persist],
  );

  const { ensureName, sheetOpen, submit, cancel } = useNameSheet(
    !!name.trim(),
    setName,
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

  const setAvatar = useCallback(
    (file: File) => {
      const uid = userIdRef.current;
      if (!uid) return;
      (async () => {
        const blob = await downscaleAvatar(file);
        const path = `${uid}.jpg`;
        const { error: err } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (err) throw err;
        // Deterministic public URL; the version param busts caches on re-upload.
        const url = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?v=${new Date().getTime()}`;
        setProfileRows((prev) => {
          const rest = prev.filter((p) => p.id !== uid);
          const me = prev.find((p) => p.id === uid);
          return [...rest, { id: uid, name: me?.name ?? "", avatar_url: url }];
        });
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
    [supabase, showNotice, refetch],
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
    setAvatar,
    days,
    blocks,
    gear,
    personal,
    menu,
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
      setBlocks((prev) =>
        prev.map((b) => {
          const r = byId.get(b.id);
          return r ? { ...b, day_part: r.day_part, sort: r.sort } : b;
        }),
      );
      (async () => {
        for (const r of rows) {
          await supabase
            .from("itinerary_blocks")
            .update({ day_part: r.day_part, sort: r.sort })
            .eq("id", r.id);
        }
        refetch("itinerary_blocks");
      })().catch((e) => {
        console.error(e);
        refetch("itinerary_blocks");
      });
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
      setGear((prev) =>
        prev.map((g) => {
          const r = byId.get(g.id);
          return r ? { ...g, category: r.category, sort: r.sort } : g;
        }),
      );
      (async () => {
        for (const r of rows) {
          await supabase
            .from("gear_items")
            .update({ category: r.category, sort: r.sort })
            .eq("id", r.id);
        }
        refetch("gear_items");
      })().catch((e) => {
        console.error(e);
        refetch("gear_items");
      });
    },

    reorderPersonal: (rows) => {
      const byId = new Map(rows.map((r) => [r.id, r]));
      setPersonal((prev) =>
        prev.map((p) => {
          const r = byId.get(p.id);
          return r ? { ...p, category: r.category, sort: r.sort } : p;
        }),
      );
      (async () => {
        for (const r of rows) {
          await supabase
            .from("personal_items")
            .update({ category: r.category, sort: r.sort })
            .eq("id", r.id);
        }
        refetch("personal_items");
      })().catch((e) => {
        console.error(e);
        refetch("personal_items");
      });
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
      };
      setPersonal((prev) => [...prev, row]);
      persist(supabase.from("personal_items").insert(row), "personal_items");
    },

    deletePersonal: (id) => {
      setPersonal((prev) => prev.filter((p) => p.id !== id && p.parent_id !== id));
      persist(supabase.from("personal_items").delete().eq("id", id), "personal_items");
    },

    addDish: ({ night, meal, dish, notes }) => {
      const row = {
        id: newId(),
        night,
        meal,
        dish,
        notes,
        added_by: userIdRef.current,
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
      };
      setShopping((prev) => [...prev, row]);
      persist(supabase.from("shopping_items").insert(row), "shopping_items");
    },

    addShopping: (label) => {
      const row = {
        id: newId(),
        menu_item_id: null,
        label,
        added_by: userIdRef.current,
        checked: false,
        checked_by: null,
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

    addExpense: (description, amountCents) => {
      const row = {
        id: newId(),
        user_id: userIdRef.current,
        description,
        amount_cents: amountCents,
        created_at: new Date().toISOString(),
      };
      setExpenses((prev) => [...prev, row]);
      persist(
        supabase.from("expenses").insert({
          id: row.id,
          user_id: row.user_id,
          description,
          amount_cents: amountCents,
        }),
        "expenses",
      );
    },

    deleteExpense: (id) => {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
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

    restoreExpense: (row) => {
      setExpenses((prev) => [...prev.filter((e) => e.id !== row.id), row]);
      persist(
        supabase.from("expenses").upsert({
          id: row.id,
          user_id: row.user_id,
          description: row.description,
          amount_cents: row.amount_cents,
          created_at: row.created_at,
        }),
        "expenses",
      );
    },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <NameSheet open={sheetOpen} onSubmit={submit} onCancel={cancel} />
    </Ctx.Provider>
  );
}
