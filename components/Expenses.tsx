"use client";

import { useRef, useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { Btn, Card, SubH } from "./primitives";
import { AddRow } from "./ui/AddRow";
import { Avatar } from "./ui/Avatar";
import { focusCenter } from "./ui/focusCenter";
import { SwipeRow } from "./ui/SwipeRow";
import { useOutside } from "./ui/useOutside";
import { useUi } from "./ui/UiProvider";
import { useData } from "@/lib/data/context";
import { PARTY_SIZE } from "@/lib/config";
import { balances, money, settle } from "@/lib/settle";
import type { Member } from "@/lib/types";

// No `w-full` here: these sit side by side in a flex row, where a 100% width
// plus the amount field overflows the card and drags the labels off-screen.
const FIELD =
  "p-2.5 rounded-lg border border-rule bg-white text-[16px] text-ink min-h-[42px]";
const LABEL = "font-mono text-[10px] tracking-[.1em] uppercase text-granite";

// Stands in for the row that doesn't exist yet while an add is being typed.
const NEW = "new";

type Draft = {
  description: string;
  amount: string;
  payer: string;
  among: string[];
};

/** Description, amount, who paid, who it was for. Same form for a new expense
 *  and an existing one — nothing is written until Done or a tap away. */
function ExpenseEditor({
  draft,
  setDraft,
  members,
  memberAvatars,
  onDone,
  onDelete,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  members: Member[];
  memberAvatars: Record<string, string>;
  onDone: () => void;
  onDelete?: () => void;
}) {
  const toggle = (id: string) =>
    setDraft({
      ...draft,
      among: draft.among.includes(id)
        ? draft.among.filter((x) => x !== id)
        : [...draft.among, id],
    });

  const everyone = draft.among.length === members.length;

  return (
    <div className="grid gap-2.5 px-3.5 py-3 bg-[#FBF8EE] border-b border-rule">
      <div className="flex gap-2">
        <input
          autoFocus
          onFocus={focusCenter}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") onDone();
          }}
          placeholder="What you bought"
          enterKeyHint="next"
          className={`${FIELD} flex-1 min-w-0`}
        />
        <input
          onFocus={focusCenter}
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") onDone();
          }}
          placeholder="0.00"
          inputMode="decimal"
          enterKeyHint="done"
          className={`${FIELD} w-[92px] shrink-0 font-mono`}
        />
      </div>

      <div className="grid gap-1.5">
        <span className={LABEL}>Paid by</span>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setDraft({ ...draft, payer: m.id })}
              aria-label={`${m.name} paid`}
              aria-pressed={draft.payer === m.id}
              className={`px-3 py-1.5 min-h-[36px] rounded-full border cursor-pointer font-mono text-[10.5px] uppercase tracking-[.07em] ${
                draft.payer === m.id
                  ? "border-blaze text-blaze bg-[#FBEFE4]"
                  : "border-rule text-granite bg-transparent"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className={LABEL}>Split between</span>
          {/* The two answers people actually want, without twelve taps. */}
          <span className="flex gap-2.5">
            <button
              onClick={() =>
                setDraft({
                  ...draft,
                  among: everyone ? [] : members.map((m) => m.id),
                })
              }
              className="bg-transparent border-none cursor-pointer font-mono text-[10.5px] text-blaze p-0"
            >
              {everyone ? "none" : "everyone"}
            </button>
            <button
              onClick={() => setDraft({ ...draft, among: [draft.payer] })}
              className="bg-transparent border-none cursor-pointer font-mono text-[10.5px] text-blaze p-0"
            >
              just them
            </button>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => {
            const on = draft.among.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                aria-label={`${on ? "Leave out" : "Include"} ${m.name}`}
                aria-pressed={on}
                className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 min-h-[34px] rounded-full border cursor-pointer text-[12.5px] ${
                  on
                    ? "border-moss bg-[#E9EEE4] text-ink"
                    : "border-rule bg-transparent text-mute"
                }`}
              >
                <Avatar userId={m.id} url={memberAvatars[m.id]} name={m.name} size={20} />
                <span className="truncate max-w-[96px]">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label="Delete expense"
            className="mr-auto bg-transparent border-none cursor-pointer p-2 text-[#C3BCA8]"
          >
            <Trash2 size={16} />
          </button>
        )}
        <Btn small onClick={onDone}>
          Done
        </Btn>
      </div>
    </div>
  );
}

/** Settling up. Its own tab since Chris flagged it: deciding what to eat and
 *  working out who owes whom are different jobs on different days. */
export function Expenses() {
  const {
    expenses,
    expenseShares,
    members,
    myMemberId,
    memberAvatars,
    ensureName,
    addExpense,
    updateExpense,
    setExpenseShares,
    deleteExpense,
    restoreExpense,
    addMember,
    renameMember,
    deleteMember,
  } = useData();
  const { showUndo, showNotice } = useUi();

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    description: "",
    amount: "",
    payer: "",
    among: [],
  });
  const [renaming, setRenaming] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name || "Someone";

  /** Shares in roster order, so the odd cents always land the same way. */
  const sharesOf = (expenseId: string) => {
    const ids = new Set(
      expenseShares.filter((s) => s.expense_id === expenseId).map((s) => s.member_id),
    );
    return members.filter((m) => ids.has(m.id)).map((m) => m.id);
  };

  const parseAmount = (s: string) => {
    const n = parseFloat(s);
    return isNaN(n) || n < 0 ? null : Math.round(n * 100);
  };

  /**
   * A blank payer means "whoever I turn out to be", resolved late.
   *
   * Tapping your name in the gate sheet and opening this editor happen in one
   * batch, so at that moment `myMemberId` is still empty — pinning the payer
   * then would quietly credit whoever sorts first on the roster.
   */
  const payerOf = (d: Draft) => d.payer || myMemberId || members[0]?.id || "";

  const commit = () => {
    const id = editing;
    setEditing(null);
    if (!id) return;
    const cents = parseAmount(draft.amount);
    const desc = draft.description.trim();
    const payer = payerOf(draft);

    if (id === NEW) {
      // Nothing typed — the add was opened and abandoned, so nothing is written.
      if (!desc && !cents) return;
      if (!payer) {
        showNotice("Add someone to the trip first");
        return;
      }
      addExpense(desc || "Untitled", cents ?? 0, payer, draft.among);
      return;
    }

    const row = expenses.find((e) => e.id === id);
    if (!row) return;
    const patch: Parameters<typeof updateExpense>[1] = {};
    if (desc && desc !== row.description) patch.description = desc;
    if (cents !== null && cents !== row.amount_cents) patch.amount_cents = cents;
    if (payer && payer !== row.payer_id) patch.payer_id = payer;
    if (Object.keys(patch).length) updateExpense(id, patch);

    const before = sharesOf(id);
    const after = draft.among;
    if (before.length !== after.length || after.some((m) => !before.includes(m)))
      setExpenseShares(id, after);
  };

  useOutside(editing !== null, editorRef, commit);

  const open = (id: string) => {
    if (editing) commit();
    const row = expenses.find((e) => e.id === id);
    if (!row) return;
    setDraft({
      description: row.description,
      amount: (row.amount_cents / 100).toFixed(2),
      payer: row.payer_id ?? "",
      among: sharesOf(id),
    });
    setEditing(id);
  };

  // Adding uses the same editor as editing — one form, one set of rules. The
  // row itself isn't written until Done, so an abandoned add leaves nothing
  // behind for anyone else to puzzle over.
  const startAdd = () =>
    ensureName(() => {
      if (editing) commit();
      setDraft({
        description: "",
        amount: "",
        payer: "",
        among: members.map((m) => m.id),
      });
      setEditing(NEW);
    });

  const drop = (id: string) => {
    const row = expenses.find((e) => e.id === id);
    if (!row) return;
    const snapShares = sharesOf(id);
    setEditing(null);
    deleteExpense(id);
    showUndo("Deleted", () => restoreExpense({ ...row }, snapShares));
  };

  const ledger = expenses
    .filter((e) => e.payer_id)
    .map((e) => ({
      payer: e.payer_id as string,
      cents: e.amount_cents,
      among: sharesOf(e.id),
    }));
  const net = balances(ledger);
  const transfers = settle(net);
  const total = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const myNet = net.get(myMemberId) ?? 0;

  const sorted = [...expenses].sort((a, b) => a.created_at.localeCompare(b.created_at));

  /** An expense a member is on — deleting them would silently redo the math. */
  const usage = (memberId: string) =>
    expenses.filter(
      (e) =>
        e.payer_id === memberId ||
        expenseShares.some((s) => s.expense_id === e.id && s.member_id === memberId),
    ).length;

  return (
    <div className="px-3.5 pt-4 pb-20">
      {/* Where you stand — the one number worth reading from across a campsite. */}
      <div className="mb-[18px]">
        {!myMemberId ? (
          <button
            onClick={() => ensureName(() => {})}
            className="bg-transparent border-none cursor-pointer p-0 text-left text-[15px] text-blaze font-semibold"
          >
            Tap your name so we know who you are →
          </button>
        ) : (
          <div className="font-display font-bold text-[26px] leading-tight text-ink">
            {myNet > 0 ? (
              <>
                You&apos;re owed <span className="text-moss">{money(myNet)}</span>
              </>
            ) : myNet < 0 ? (
              <>
                You owe <span className="text-blaze">{money(-myNet)}</span>
              </>
            ) : (
              <span className="text-mute">You&apos;re square</span>
            )}
          </div>
        )}
        <div className="font-mono text-[11px] text-granite mt-1">
          {money(total)} spent by the group
        </div>
      </div>

      {transfers.length > 0 && (
        <div className="mb-5">
          <SubH right={`${transfers.length} payment${transfers.length > 1 ? "s" : ""}`}>
            Settle up
          </SubH>
          <Card className="overflow-hidden">
            {transfers.map((t) => {
              const mine = t.from === myMemberId || t.to === myMemberId;
              return (
                <div
                  key={`${t.from}-${t.to}`}
                  // The suite sums these to prove the payments clear the ledger.
                  data-settle={t.cents}
                  className="flex items-center gap-2 px-3.5 py-3 border-b border-rule last:border-b-0"
                >
                  <Avatar
                    userId={t.from}
                    url={memberAvatars[t.from]}
                    name={nameOf(t.from)}
                    size={22}
                  />
                  <span
                    className={`text-[14px] truncate ${mine ? "text-ink font-medium" : "text-granite"}`}
                  >
                    {nameOf(t.from)}
                  </span>
                  <ArrowRight size={13} className="text-mute shrink-0" />
                  <Avatar
                    userId={t.to}
                    url={memberAvatars[t.to]}
                    name={nameOf(t.to)}
                    size={22}
                  />
                  <span
                    className={`flex-1 min-w-0 text-[14px] truncate ${mine ? "text-ink font-medium" : "text-granite"}`}
                  >
                    {nameOf(t.to)}
                  </span>
                  <span
                    className={`font-mono text-[14px] shrink-0 ${mine ? "text-blaze font-semibold" : "text-granite"}`}
                  >
                    {money(t.cents)}
                  </span>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      <div className="mb-5">
        <SubH right={sorted.length ? `${sorted.length}` : null}>What we spent</SubH>
        <Card className="overflow-hidden">
          {sorted.length === 0 && (
            <div className="p-5 text-[13.5px] text-mute text-center border-b border-rule">
              Nothing logged yet. Add what you bought and pick who it was for —
              the app works out who owes whom.
            </div>
          )}
          {sorted.map((e) => {
            if (editing === e.id) {
              return (
                <div key={e.id} ref={editorRef}>
                  <ExpenseEditor
                    draft={{ ...draft, payer: payerOf(draft) }}
                    setDraft={setDraft}
                    members={members}
                    memberAvatars={memberAvatars}
                    onDone={commit}
                    onDelete={() => drop(e.id)}
                  />
                </div>
              );
            }
            const among = sharesOf(e.id);
            const mineShare = among.includes(myMemberId);
            return (
              <SwipeRow key={e.id} className="border-b border-rule" onDelete={() => drop(e.id)}>
                <button
                  onClick={() => open(e.id)}
                  className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-2.5 px-3.5 py-3"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] text-ink truncate">
                      {e.description || "Untitled"}
                    </span>
                    <span className="block font-mono text-[10.5px] text-moss mt-0.5 truncate">
                      {nameOf(e.payer_id ?? "")} paid
                      {among.length > 0 &&
                        ` · split ${among.length === members.length ? "with everyone" : `${among.length} way${among.length > 1 ? "s" : ""}`}`}
                      {!mineShare && myMemberId && " · not you"}
                    </span>
                  </span>
                  <span className="font-mono text-[14px] text-ink font-medium shrink-0">
                    {money(e.amount_cents)}
                  </span>
                </button>
              </SwipeRow>
            );
          })}
          {editing === NEW ? (
            <div ref={editorRef}>
              <ExpenseEditor
                draft={{ ...draft, payer: payerOf(draft) }}
                setDraft={setDraft}
                members={members}
                memberAvatars={memberAvatars}
                onDone={commit}
              />
            </div>
          ) : (
            <button
              onClick={startAdd}
              className="flex items-center gap-1.5 w-full text-left bg-transparent border-none cursor-pointer text-granite text-[13px] px-3.5 py-[11px] min-h-[44px]"
            >
              <Plus size={14} /> Add an expense
            </button>
          )}
        </Card>
      </div>

      <div>
        <SubH
          right={
            members.length < PARTY_SIZE ? `${members.length} of ${PARTY_SIZE}` : null
          }
        >
          Who&apos;s on the trip
        </SubH>
        <Card className="overflow-hidden">
          {members.map((m) => {
            if (renaming === m.id) {
              return (
                <div key={m.id} className="px-3.5 py-2 border-b border-rule bg-[#FBF8EE]">
                  <input
                    autoFocus
                    onFocus={focusCenter}
                    value={nameDraft}
                    onChange={(ev) => setNameDraft(ev.target.value)}
                    onBlur={() => {
                      if (nameDraft.trim()) renameMember(m.id, nameDraft);
                      setRenaming(null);
                    }}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") ev.currentTarget.blur();
                      if (ev.key === "Escape") setRenaming(null);
                    }}
                    enterKeyHint="done"
                    className={`${FIELD} w-full`}
                  />
                </div>
              );
            }
            const n = usage(m.id);
            return (
              <SwipeRow
                key={m.id}
                className="border-b border-rule"
                onDelete={() => {
                  // Removing someone mid-ledger would rewrite everyone's
                  // balance without saying so.
                  if (n > 0) {
                    showNotice(`${m.name} is on ${n} expense${n > 1 ? "s" : ""}`);
                    return;
                  }
                  const snap = { ...m };
                  deleteMember(m.id);
                  showUndo("Removed", () => addMember(snap.name));
                }}
              >
                <button
                  onClick={() => {
                    setNameDraft(m.name);
                    setRenaming(m.id);
                  }}
                  className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-2.5 px-3.5 py-3"
                >
                  <Avatar userId={m.id} url={memberAvatars[m.id]} name={m.name} size={26} />
                  <span className="flex-1 min-w-0 text-[14.5px] text-ink truncate">
                    {m.name}
                  </span>
                  {m.id === myMemberId && (
                    <span className="font-mono text-[10px] uppercase tracking-[.08em] text-moss shrink-0">
                      you
                    </span>
                  )}
                </button>
              </SwipeRow>
            );
          })}
          <AddRow
            label="Add someone"
            placeholder="Their name"
            onAdd={(t) => addMember(t)}
          />
        </Card>
        {members.length < PARTY_SIZE && (
          <div className="px-1 pt-2 text-[11.5px] text-mute leading-[1.45]">
            Add the rest of the {PARTY_SIZE} so splits land on the right people.
            They don&apos;t need the app open to owe you money.
          </div>
        )}
      </div>
    </div>
  );
}
