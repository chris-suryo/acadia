"use client";

import { useRef, useState } from "react";
import { Pencil, ThumbsUp, Trash2 } from "lucide-react";
import { Box, Btn, Card, Kill, Segmented, SubH } from "./primitives";
import { Avatar } from "./ui/Avatar";
import { AddRow } from "./ui/AddRow";
import { Chips } from "./ui/Chips";
import { focusCenter } from "./ui/focusCenter";
import { SwipeRow } from "./ui/SwipeRow";
import { useOutside } from "./ui/useOutside";
import { useSink, vtName } from "./ui/useSink";
import { useUi } from "./ui/UiProvider";
import { useData } from "@/lib/data/context";
import { MEALS, VOTED_SLOTS } from "@/lib/seeds";
import type { MenuItem, ShoppingItem } from "@/lib/types";
import { AISLES, aisleOf } from "@/lib/aisle";
import { mergeLines } from "@/lib/store";

const MEAL_CHIPS = MEALS.map((m) => ({ value: m, label: m }));

export function Food({
  view,
  setView,
}: {
  view: string;
  setView: (v: string) => void;
}) {
  const {
    menu,
    menuVotes,
    toggleVote,
    shopping,
    surveys,
    profiles,
    isMe,
    memberOf,
    ensureName,
    updateDish,
    deleteDish,
    restoreDish,
    addIngredient,
    addShopping,
    toggleShopping,
    deleteShopping,
    restoreShopping,
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

  // One person, one vote. Two devices signed in as the same human shouldn't
  // count twice or show up as two faces under a dish.
  const votersOf = (menuItemId: string) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of menuVotes) {
      if (v.menu_item_id !== menuItemId) continue;
      const who = memberOf(v.user_id) || v.user_id;
      if (seen.has(who)) continue;
      seen.add(who);
      out.push(v.user_id);
    }
    return out;
  };
  const voteCount = (menuItemId: string) => votersOf(menuItemId).length;

  // Nobody locks the menu in by hand: whichever dish leads its meal is the
  // plan, and a tie marks both. Silent until at least one vote exists, so an
  // untouched list doesn't crown an arbitrary row.
  const leading = new Set<string>();
  for (const night of new Set(menu.map((m) => m.night))) {
    for (const meal of new Set(
      menu.filter((m) => m.night === night).map((m) => m.meal),
    )) {
      const inSlot = menu.filter((m) => m.night === night && m.meal === meal);
      const top = Math.max(...inSlot.map((m) => voteCount(m.id)));
      if (top > 0)
        for (const m of inSlot) if (voteCount(m.id) === top) leading.add(m.id);
    }
  }

  /**
   * What we're actually eating.
   *
   * Two meals are put to a vote and take their winner — a tie takes both. The
   * rest of the menu isn't a question: the trail lunch, Sunday breakfast,
   * snacks and drinks are just bought, so they're always on the list.
   */
  const planned = new Map<string, "voted" | "default" | "fixed">();
  for (const m of menu) if (!m.votable) planned.set(m.id, "fixed");
  for (const [night, meal] of VOTED_SLOTS) {
    const inSlot = menu
      .filter((m) => m.votable && m.night === night && m.meal === meal)
      .sort((a, b) => a.sort - b.sort);
    const top = Math.max(0, ...inSlot.map((m) => voteCount(m.id)));
    if (top > 0) {
      for (const m of inSlot) if (voteCount(m.id) === top) planned.set(m.id, "voted");
    } else if (inSlot[0]) {
      // Nobody's voted yet, so the first option stands in and the list stays
      // shoppable. It changes the moment one person taps.
      planned.set(inSlot[0].id, "default");
    }
  }
  const undecided = [...planned.values()].filter((v) => v === "default").length;
  const votedSlots = [...planned.values()].filter((v) => v === "voted").length;
  const fixed = menu.filter((m) => !m.votable).map((m) => m.dish);

  // Store: dish ingredients in menu order, then standalone adds.
  const menuOrder = new Map(menu.map((m, i) => [m.id, i] as const));
  const storeRows: (ShoppingItem & {
    tag: string;
    tagTone: "moss" | "blaze";
    standalone: boolean;
  })[] = [
    ...shopping
      .filter((s) => s.menu_item_id !== null && planned.has(s.menu_item_id))
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
          tag: who || "asked for",
          tagTone: "blaze" as const,
          standalone: true,
        };
      }),
  ];

  /**
   * One line per thing in the cart, not one per dish that wants it.
   *
   * Five dishes ask for tortillas and four for shredded cheese; unmerged
   * that's the same product met three times in one aisle with a different
   * number beside it each time. `mergeLines` adds up what shares units and
   * leaves alone what doesn't.
   */
  const merged = mergeLines(storeRows).map((line) => {
    const first = line.rows[0];
    const extra = line.rows.length - 1;
    return {
      ...first,
      id: first.id,
      label: line.label,
      checked: line.checked,
      rows: line.rows,
      tag: extra > 0 ? `${first.tag} +${extra} more` : first.tag,
      // A line folded from several rows has no single thing to delete, and no
      // single person to credit.
      standalone: extra === 0 && first.standalone,
      added_by: extra === 0 ? first.added_by : null,
    };
  });

  const sunkStoreRows = sink(merged);
  // Grouped by where things sit in a shop, not by where the row came from.
  const byAisle = AISLES.map((aisle) => ({
    aisle,
    rows: sunkStoreRows.filter((r) => aisleOf(r.label) === aisle),
  })).filter((g) => g.rows.length > 0);
  const storeLeft = merged.filter((r) => !r.checked).length;

  /** Ticking a merged line ticks every row behind it — you bought the
   *  tortillas, so all five dishes have their tortillas. Rows already in the
   *  target state are left alone, or a half-ticked line would flip apart. */
  const toggleLine = (line: (typeof merged)[number]) => {
    const target = !line.checked;
    for (const r of line.rows) if (r.checked !== target) toggleShopping(r.id);
  };
  // Questionnaire food answers surface here — the menu is where they get acted on.
  const requests = surveys
    .filter((s) => s.food.trim())
    .map((s) => ({
      id: s.user_id,
      who: profiles[s.user_id]?.trim() || "Someone",
      text: s.food,
    }))
    .sort((a, b) => a.who.localeCompare(b.who));

  const dishRow = (f: MenuItem) => {
    const ings = ingredientsOf(f.id);
    if (expandedId !== f.id) {
      const voters = votersOf(f.id);
      const mine = voters.some((v) => isMe(v));
      return (
        <div
          key={f.id}
          className="flex items-center gap-1 pr-1.5 border-b border-rule"
        >
          {/* The whole row votes. Voting is what this list is for, so it gets
              the big target; editing moved behind the pencil. */}
          <button
            aria-label={mine ? `Remove your vote for ${f.dish}` : `Vote for ${f.dish}`}
            aria-pressed={mine}
            onClick={() => ensureName(() => toggleVote(f.id))}
            className="flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer flex items-center gap-2.5 pl-3.5 py-3"
          >
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="text-[14.5px] text-ink font-medium truncate">
                  {f.dish}
                </span>
                {leading.has(f.id) && (
                  <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[.08em] text-white bg-moss rounded-full px-1.5 py-[1px]">
                    leading
                  </span>
                )}
              </span>
              {voters.length > 0 && (
                <span className="flex items-center gap-1.5 mt-[3px]">
                  {voters.slice(0, 6).map((v) => (
                    <Avatar
                      key={v}
                      userId={v}
                      name={profiles[v]?.trim() || "?"}
                      size={17}
                    />
                  ))}
                </span>
              )}
            </span>
            <span
              className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[11px] ${
                mine
                  ? "bg-moss border-moss text-white"
                  : "bg-transparent border-rule text-granite"
              }`}
            >
              <ThumbsUp size={12} />
              {voters.length}
            </span>
          </button>
          <button
            aria-label={`Edit ${f.dish}`}
            onClick={() => expand(f)}
            className="shrink-0 bg-transparent border-none cursor-pointer p-2 text-faint"
          >
            <Pencil size={14} />
          </button>
        </div>
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
                <Box
                  on={s.checked}
                  onClick={() => toggleShopping(s.id)}
                  label={s.label}
                />
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
            {/* Otherwise you type four ingredients, open the Store, and they
                aren't there — the list only carries what we're cooking. */}
            {ings.length > 0 && !planned.has(f.id) && (
              <div className="pt-1.5 text-[11px] text-mute leading-[1.45]">
                Not on the plan yet — these stay off the store list until this
                dish wins its meal.
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => {
                const snapshot = { ...f };
                const snapIngs = ings.map((s) => ({ ...s }));
                collapse();
                deleteDish(f.id);
                showUndo("Deleted", () => restoreDish(snapshot, snapIngs));
              }}
              aria-label="Delete dish"
              className="bg-transparent border-none cursor-pointer p-2 text-faint"
            >
              <Trash2 size={16} />
            </button>
            <Btn small onClick={collapse}>
              Done
            </Btn>
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
          { id: "menu", label: "Vote" },
          { id: "shop", label: storeLeft > 0 ? `List · ${storeLeft} left` : "List" },
        ]}
      />
      {view === "menu" && (
        <>
          {requests.length > 0 && (
            <div className="mb-5">
              <SubH>Requests</SubH>
              <Card className="overflow-hidden">
                {requests.map((r, i) => (
                  <div
                    key={r.id}
                    className={`px-3.5 py-3 ${i > 0 ? "border-t border-rule" : ""}`}
                  >
                    <div className="text-[13.5px] text-ink leading-[1.5]">{r.text}</div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Avatar userId={r.id} name={r.who} size={17} />
                        <span className="font-mono text-[10.5px] text-moss truncate">
                          {r.who}
                        </span>
                      </span>
                      {/* A request that can't become a line on the shopping
                          list is just a wish. */}
                      <button
                        onClick={() => ensureName(() => addShopping(r.text))}
                        className="shrink-0 rounded-full border border-rule px-2 py-0.5 bg-transparent cursor-pointer font-mono text-[10.5px] text-blaze"
                      >
                        add to list
                      </button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
          {/* The two things that shaped this ballot. Said once, at the top,
              rather than as a description under every dish. */}
          <Card className="px-3.5 py-3 mb-5">
            <div className="text-[13.5px] text-ink leading-[1.5]">
              Every option works without meat.
            </div>
            <div className="text-[11.5px] text-mute mt-1 leading-[1.45]">
              The meat cooks separately and goes in at the end, so nobody needs
              a different dinner. One burner and the fire, so nothing here needs
              two pans at once.
            </div>
          </Card>

          {/* Two questions, not nine. Everything else on the menu is being
              bought rather than decided, and says so below. */}
          {VOTED_SLOTS.map(([night, meal]) => {
            const rows = menu
              .filter((m) => m.votable && m.night === night && m.meal === meal)
              // Most-wanted first — the list should say what we're having,
              // not what happened to be typed first.
              .sort((a, b) => voteCount(b.id) - voteCount(a.id) || a.sort - b.sort);
            if (rows.length === 0) return null;
            return (
              <div key={`${night}-${meal}`} className="mb-5">
                <SubH right="tap to vote">
                  {night} {meal.toLowerCase()}
                </SubH>
                <Card className="overflow-hidden">{rows.map((f) => dishRow(f))}</Card>
              </div>
            );
          })}

          {/* The other half of what this tab is for: someone wants Cheez-Its,
              and it should take one tap to get onto the shopping list with
              their name on it — not a trip through the menu. */}
          <div className="mb-5">
            <SubH>Want something specific?</SubH>
            <Card className="overflow-hidden">
              <div className="px-3.5 pt-3 pb-1 text-[11.5px] text-mute leading-[1.45]">
                Straight onto the shopping list, with your name next to it.
              </div>
              <AddRow
                label="Add to the list"
                placeholder="Cheez-Its, oat milk, hot sauce…"
                onAdd={(t) => ensureName(() => addShopping(t))}
              />
            </Card>
          </div>

          {fixed.length > 0 && (
            <div className="mb-5">
              <SubH>Already on the list</SubH>
              <Card className="px-3.5 py-3">
                <div className="text-[11.5px] text-mute leading-[1.5]">
                  {fixed.join(" · ")} — nobody has to vote on these.
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {view === "shop" && (
        <>
        {/* What this list covers, said plainly — a list you can't account for
            is one you second-guess in the aisle. */}
        <Card className="overflow-hidden mb-5">
          <div className="px-3.5 pt-3 pb-1 text-[13.5px] text-ink">
            Everything for the weekend, added up.
          </div>
          <div className="px-3.5 pb-2 text-[11.5px] text-mute leading-[1.45]">
            {undecided > 0
              ? `${undecided === 1 ? "One meal has" : `${undecided} meals have`} no votes yet, so the first option stands in — vote and this list follows.`
              : votedSlots > 0
                ? "Both meals went to a vote. This is what won."
                : "Everything here is being bought, not decided."}
          </div>
          <AddRow
            label="Ask for something"
            placeholder="Clif bars, oat milk, hot sauce…"
            onAdd={(t) => ensureName(() => addShopping(t))}
          />
        </Card>
        {byAisle.map(({ aisle, rows }) => (
        <div key={aisle} className="mb-5">
        <SubH>{aisle}</SubH>
        <Card className="overflow-hidden">
          {rows.map((g) => {
            const row = (
              <button
                role="checkbox"
                aria-checked={g.checked}
                aria-label={`${g.label} — ${g.tag}`}
                onClick={() => {
                  toggleLine(g);
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
                  <span className="flex items-center gap-1.5 mt-0.5">
                    {g.added_by && (
                      <Avatar
                        userId={g.added_by}
                        name={profiles[g.added_by]?.trim() || "?"}
                        size={16}
                      />
                    )}
                    <span
                      className={`font-mono text-[10.5px] truncate ${
                        g.tagTone === "moss" ? "text-moss" : "text-blaze"
                      }`}
                    >
                      {g.tag}
                    </span>
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
        </Card>
        </div>
        ))}
        {byAisle.length === 0 && (
          <div className="p-5 text-[13.5px] text-mute text-center">
            Nothing on the list yet. Dishes you put on the menu bring their
            ingredients here.
          </div>
        )}
        </>
      )}

    </div>
  );
}
