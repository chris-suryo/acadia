"use client";

import { useRef, useState } from "react";
import { ArrowRight, Camera, Plus, Trash2, X } from "lucide-react";
import { Btn, Card, SubH } from "./primitives";
import { AvatarEditor } from "./AvatarEditor";
import { Avatar } from "./ui/Avatar";
import { onFieldFocus } from "./ui/keepVisible";
import { PeoplePicker, splitLabel } from "./ui/PeoplePicker";
import { RosterSheet } from "./ui/RosterSheet";
import { VenmoButton } from "./ui/VenmoButton";
import { SwipeRow } from "./ui/SwipeRow";
import { useOutside } from "./ui/useOutside";
import { useUi } from "./ui/UiProvider";
import { useData } from "@/lib/data/context";
import { balances, money, settle, shares, venmoLink } from "@/lib/settle";
import type { Member, Receipt } from "@/lib/types";

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

let localSeq = 0;
const newLocalId = () => `pending-${++localSeq}`;

const parseAmount = (s: string) => {
  const n = parseFloat(s);
  return isNaN(n) || n < 0 ? null : Math.round(n * 100);
};

/** "$60.88 each" under the split line, so the division is visible as you type. */
function perHead(amount: string, n: number): string {
  const cents = parseAmount(amount);
  if (!cents || n < 1) return `${n} ${n === 1 ? "person" : "people"}`;
  return `${money(Math.round(cents / n))} each · ${n} ${n === 1 ? "person" : "people"}`;
}

/** Description, amount, who paid, who it was for. Same form for a new expense
 *  and an existing one — nothing is written until Done or a tap away. */
function ExpenseEditor({
  draft,
  setDraft,
  members,
  memberAvatars,
  solo,
  receipts,
  onAddReceipt,
  onDeleteReceipt,
  onViewReceipt,
  onDone,
  onDelete,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  members: Member[];
  memberAvatars: Record<string, string>;
  solo: { id: string; label: string };
  receipts: Receipt[];
  onAddReceipt: (f: File) => void;
  onDeleteReceipt: (id: string) => void;
  onViewReceipt: (url: string) => void;
  onDone: () => void;
  onDelete?: () => void;
}) {
  const [pickOpen, setPickOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="grid gap-3 px-3.5 py-3.5 bg-[#FBF8EE] border-b border-rule">
      <input
        autoFocus
        onFocus={onFieldFocus}
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") onDone();
        }}
        placeholder="What you bought"
        enterKeyHint="next"
        className={`${FIELD} w-full text-[17px]`}
      />

      {/* The amount is the point of the row, so it gets the size and a $ that
          sits inside the field instead of being something you have to type. */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[22px] text-granite pointer-events-none">
          $
        </span>
        <input
          onFocus={onFieldFocus}
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") onDone();
          }}
          placeholder="0.00"
          inputMode="decimal"
          enterKeyHint="done"
          aria-label="Amount"
          className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-rule bg-white font-mono text-[24px] text-ink min-h-[52px]"
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
              className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 min-h-[34px] rounded-full border cursor-pointer text-[12.5px] ${
                draft.payer === m.id
                  ? "border-blaze bg-[#FBEFE4] text-ink"
                  : "border-rule bg-transparent text-mute"
              }`}
            >
              <Avatar userId={m.id} url={memberAvatars[m.id]} name={m.name} size={20} />
              <span className="truncate max-w-[96px]">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* One line rather than twelve pills — the detail lives in the sheet. */}
      <div className="grid gap-1.5">
        <span className={LABEL}>Split between</span>
        <button
          onClick={() => setPickOpen(true)}
          className="w-full text-left bg-white border border-rule rounded-lg cursor-pointer flex items-center gap-2 px-3 py-2.5 min-h-[46px]"
        >
          <span className="flex -space-x-1.5 shrink-0">
            {members
              .filter((m) => draft.among.includes(m.id))
              .slice(0, 4)
              .map((m) => (
                <Avatar
                  key={m.id}
                  userId={m.id}
                  url={memberAvatars[m.id]}
                  name={m.name}
                  size={22}
                />
              ))}
          </span>
          <span className="flex-1 min-w-0 text-[14px] text-ink truncate">
            {splitLabel(members, draft.among)}
          </span>
          <span className="font-mono text-[11px] text-blaze shrink-0">change</span>
        </button>
        {draft.among.length > 0 && (
          <span className="font-mono text-[10.5px] text-mute">
            {perHead(draft.amount, draft.among.length)}
          </span>
        )}
      </div>

      <div className="grid gap-1.5">
        <span className={LABEL}>Receipt</span>
        <div className="flex flex-wrap gap-2">
          {receipts.map((r) => (
            <span key={r.id} className="relative">
              <button
                onClick={() => onViewReceipt(r.url)}
                aria-label="View receipt"
                className="block w-[54px] h-[54px] rounded-lg overflow-hidden border border-rule bg-white cursor-pointer p-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
                <img src={r.url} alt="" className="w-full h-full object-cover" />
              </button>
              <button
                onClick={() => onDeleteReceipt(r.id)}
                aria-label="Remove receipt"
                className="absolute -top-1.5 -right-1.5 w-[20px] h-[20px] rounded-full bg-ink text-parchment border-none cursor-pointer flex items-center justify-center p-0"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Add a receipt"
            className="w-[54px] h-[54px] rounded-lg border border-dashed border-rule bg-transparent cursor-pointer flex items-center justify-center text-granite"
          >
            <Camera size={18} />
          </button>
          {/* No `capture` attribute: iOS then offers the camera *and* the photo
              library, which is where a receipt already photographed lives. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              for (const f of Array.from(e.target.files ?? [])) onAddReceipt(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label="Delete expense"
            className="mr-auto bg-transparent border-none cursor-pointer p-2 text-faint"
          >
            <Trash2 size={16} />
          </button>
        )}
        <Btn small onClick={onDone}>
          Done
        </Btn>
      </div>

      <PeoplePicker
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        members={members}
        selected={draft.among}
        onChange={(ids) => setDraft({ ...draft, among: ids })}
        solo={solo}
      />
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
    settlements,
    addSettlement,
    deleteSettlement,
    restoreSettlement,
    receipts,
    addReceipt,
    deleteReceipt,
    setMemberVenmo,
  } = useData();
  const { showUndo, showNotice } = useUi();
  const [viewing, setViewing] = useState<string | null>(null);
  const [openTransfer, setOpenTransfer] = useState<string | null>(null);
  const [allTransfers, setAllTransfers] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  // An expense being added has no id yet, so its photos wait here and go up the
  // moment it's saved — you shouldn't have to save first and reopen to attach
  // the receipt that's already in your hand.
  const [pending, setPending] = useState<{ id: string; file: File; url: string }[]>([]);
  const dropPending = () => {
    setPending((prev) => {
      for (const p of prev) URL.revokeObjectURL(p.url);
      return [];
    });
  };

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    description: "",
    amount: "",
    payer: "",
    among: [],
  });
  const editorRef = useRef<HTMLDivElement | null>(null);

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name || "Someone";
  const receiptsOf = (expenseId: string) =>
    receipts.filter((r) => r.expense_id === expenseId);

  /** What one person owes on one expense, odd cents and all. */
  const shareOf = (e: { id: string; amount_cents: number }, memberId: string) =>
    shares(e.amount_cents, sharesOf(e.id)).get(memberId) ?? 0;

  /** Shares in roster order, so the odd cents always land the same way. */
  const sharesOf = (expenseId: string) => {
    const ids = new Set(
      expenseShares.filter((s) => s.expense_id === expenseId).map((s) => s.member_id),
    );
    return members.filter((m) => ids.has(m.id)).map((m) => m.id);
  };

  /**
   * A blank payer means "whoever I turn out to be", resolved late.
   *
   * Tapping your name in the gate sheet and opening this editor happen in one
   * batch, so at that moment `myMemberId` is still empty — pinning the payer
   * then would quietly credit whoever sorts first on the roster.
   */
  const payerOf = (d: Draft) => d.payer || myMemberId || members[0]?.id || "";

  /** The one-person shortcut, named after whoever paid. */
  const soloOf = (d: Draft) => {
    const id = payerOf(d);
    return { id, label: id === myMemberId ? "Just me" : `Just ${nameOf(id)}` };
  };

  const commit = () => {
    const id = editing;
    if (!id) return;
    const cents = parseAmount(draft.amount);
    const desc = draft.description.trim();
    const payer = payerOf(draft);

    // An expense split with nobody never reaches the settle-up: `balances`
    // skips it, so the payer is silently never paid back while the amount
    // still counts toward what the group spent. Refuse to write it, and hold
    // the editor open until someone is picked — the trash can is the way out.
    if (draft.among.length === 0 && (id !== NEW || desc || cents)) {
      showNotice("Pick who this was for");
      return;
    }

    setEditing(null);

    if (id === NEW) {
      // Nothing typed — the add was opened and abandoned, so nothing is written.
      if (!desc && !cents) {
        dropPending();
        return;
      }
      if (!payer) {
        showNotice("Add someone to the trip first");
        return;
      }
      const newId = addExpense(desc || "Untitled", cents ?? 0, payer, draft.among);
      for (const p of pending) addReceipt(newId, p.file);
      dropPending();
      return;
    }

    const row = expenses.find((e) => e.id === id);
    if (!row) return;
    const patch: Parameters<typeof updateExpense>[1] = {};
    // Compared without a truthiness guard: emptying the field is an edit like
    // any other, and silently keeping the old text is worse than a blank row.
    if (desc !== row.description) patch.description = desc;
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
  const net = balances(
    ledger,
    settlements.map((x) => ({
      from: x.from_member,
      to: x.to_member,
      cents: x.amount_cents,
    })),
  );
  const transfers = settle(net);
  const total = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const myNet = net.get(myMemberId) ?? 0;
  // The two halves of that number, so it stops reading as a bug: you paid $30
  // but you're owed $24.54, because your own seat at the table costs you the
  // same share as everyone else's.
  const myPaid = expenses
    .filter((e) => e.payer_id === myMemberId)
    .reduce((s, e) => s + e.amount_cents, 0);
  const myShare = expenses.reduce((s, e) => s + shareOf(e, myMemberId), 0);
  const mySettled = settlements.reduce(
    (s, x) =>
      s + (x.from_member === myMemberId ? x.amount_cents : 0) -
      (x.to_member === myMemberId ? x.amount_cents : 0),
    0,
  );

  const sorted = [...expenses].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const settled = [...settlements].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  return (
    <div className="px-3.5 pt-4 pb-20">
      <AvatarEditor open={photoOpen} onClose={() => setPhotoOpen(false)} />
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
          {myMemberId && (myPaid > 0 || myShare > 0) && (
            <>
              {" "}· you paid {money(myPaid)} · your share {money(myShare)}
              {mySettled !== 0 && <> · {money(Math.abs(mySettled))} settled</>}
            </>
          )}
        </div>
      </div>

      {viewing && (
        <button
          onClick={() => setViewing(null)}
          aria-label="Close receipt"
          className="fixed inset-0 z-50 bg-black/85 border-none cursor-zoom-out flex items-center justify-center p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
          <img src={viewing} alt="Receipt" className="max-w-full max-h-full object-contain" />
        </button>
      )}

      <div className="mb-5">
        <SubH right={sorted.length ? `${sorted.length}` : null}>What we spent</SubH>
        <Card className="overflow-hidden">
          {sorted.length === 0 && editing !== NEW && (
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
                    solo={soloOf(draft)}
                    receipts={receiptsOf(e.id)}
                    onAddReceipt={(f) => addReceipt(e.id, f)}
                    onDeleteReceipt={deleteReceipt}
                    onViewReceipt={setViewing}
                    onDone={commit}
                    onDelete={() => drop(e.id)}
                  />
                </div>
              );
            }
            const among = sharesOf(e.id);
            const mineShare = among.includes(myMemberId);
            const shown = detail === e.id;
            return (
              <SwipeRow key={e.id} className="border-b border-rule" onDelete={() => drop(e.id)}>
                {/* Tapping opens what it was, not how to change it — the
                    receipt and who's actually on the hook. Editing is a step
                    further in, where it can't be reached by accident. */}
                <button
                  onClick={() => setDetail(shown ? null : e.id)}
                  aria-expanded={shown}
                  className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-2.5 px-3.5 py-3"
                >
                  {/* A receipt is worth seeing from the list — it's the answer
                      to "what was actually in that $243?" */}
                  {receiptsOf(e.id)[0] && (
                    <span className="w-9 h-9 rounded-md overflow-hidden border border-rule shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
                      <img
                        src={receiptsOf(e.id)[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] text-ink truncate">
                      {e.description || "Untitled"}
                    </span>
                    <span className="flex items-center gap-1.5 mt-0.5">
                      {/* The face makes the list scannable — "which ones are
                          Erin's" stops requiring reading. */}
                      <Avatar
                        userId={e.payer_id ?? ""}
                        url={memberAvatars[e.payer_id ?? ""]}
                        name={nameOf(e.payer_id ?? "")}
                        size={16}
                      />
                      <span className="font-mono text-[10.5px] text-moss truncate">
                        {nameOf(e.payer_id ?? "")} paid
                        {among.length > 0 &&
                          ` · split ${among.length === members.length ? "with everyone" : `${among.length} way${among.length > 1 ? "s" : ""}`}`}
                        {!mineShare && myMemberId && " · not you"}
                      </span>
                    </span>
                  </span>
                  <span className="font-mono text-[14px] text-ink font-medium shrink-0">
                    {money(e.amount_cents)}
                  </span>
                </button>
                {shown && (
                  <div className="px-3.5 pb-3.5 grid gap-3 bg-[#FBF8EE] border-t border-rule pt-3">
                    {receiptsOf(e.id).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {receiptsOf(e.id).map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setViewing(r.url)}
                            aria-label="View receipt"
                            className="w-[72px] h-[72px] rounded-lg overflow-hidden border border-rule bg-white cursor-pointer p-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- user upload */}
                            <img src={r.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-1.5">
                      <span className={LABEL}>
                        Split between · {perHead(String(e.amount_cents / 100), among.length)}
                      </span>
                      <div className="grid gap-1">
                        {members
                          .filter((m) => among.includes(m.id))
                          .map((m) => (
                            <div key={m.id} className="flex items-center gap-2">
                              <Avatar
                                userId={m.id}
                                url={memberAvatars[m.id]}
                                name={m.name}
                                size={20}
                              />
                              <span className="flex-1 min-w-0 text-[13.5px] text-ink truncate">
                                {m.name}
                                {m.id === e.payer_id && (
                                  <span className="font-mono text-[10px] text-moss ml-1.5">
                                    paid
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-[12.5px] text-granite shrink-0">
                                {money(shareOf(e, m.id))}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setDetail(null);
                          drop(e.id);
                        }}
                        aria-label="Delete expense"
                        className="bg-transparent border-none cursor-pointer p-2 text-[#8F8676]"
                      >
                        <Trash2 size={16} />
                      </button>
                      <Btn
                        small
                        onClick={() => {
                          setDetail(null);
                          open(e.id);
                        }}
                      >
                        Edit
                      </Btn>
                    </div>
                  </div>
                )}
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
                solo={soloOf(draft)}
                receipts={pending.map((p) => ({
                  id: p.id,
                  expense_id: NEW,
                  url: p.url,
                  sort: 0,
                }))}
                onAddReceipt={(f) =>
                  setPending((prev) => [
                    ...prev,
                    { id: newLocalId(), file: f, url: URL.createObjectURL(f) },
                  ])
                }
                onDeleteReceipt={(id) =>
                  setPending((prev) => {
                    const hit = prev.find((p) => p.id === id);
                    if (hit) URL.revokeObjectURL(hit.url);
                    return prev.filter((p) => p.id !== id);
                  })
                }
                onViewReceipt={setViewing}
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

      {transfers.length > 0 && (
        <div className="mb-5">
          <SubH right={`${transfers.length} payment${transfers.length > 1 ? "s" : ""}`}>
            Settle up
          </SubH>
          {/* Without this line the list reads as broken: you pay one person
              for a site someone else booked, and one debt can split across
              two people. That's the netting doing its job — say so. */}
          <div className="font-mono text-[10.5px] text-mute mb-1.5 leading-[1.5]">
            Everyone&apos;s debts are netted into the fewest payments — who you
            pay isn&apos;t always who you split with.
          </div>
          <Card className="overflow-hidden">
            {(allTransfers ? transfers : transfers.slice(0, 3)).map((t) => {
              const iOwe = t.from === myMemberId;
              const owedToMe = t.to === myMemberId;
              const mine = iOwe || owedToMe;
              // You can pay your own debt and chase someone else's; there's
              // nothing useful to do about two other people's.
              const other = iOwe ? t.to : t.from;
              const key = `${t.from}-${t.to}`;
              const link = venmoLink(
                iOwe ? "pay" : "charge",
                members.find((m) => m.id === other)?.venmo ?? "",
                t.cents,
              );
              return (
                <div
                  key={`${t.from}-${t.to}`}
                  // The suite sums these to prove the payments clear the ledger.
                  data-settle={t.cents}
                  className="border-b border-rule last:border-b-0"
                >
                  {/* Eleven people around one big grocery run is ten rows; with
                      the actions always out that card is taller than the ledger
                      it's summarising. Tap the one you're settling. */}
                  <button
                    onClick={() =>
                      setOpenTransfer(openTransfer === key ? null : key)
                    }
                    aria-expanded={openTransfer === key}
                    className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-2 px-3.5 py-3">
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
                  </button>
                  {openTransfer === key && (
                  <div className="px-3.5 pb-3 grid gap-2">
                  {/* Venmo can only prefill a person it has a handle for, and
                      this is the moment you notice it's missing. */}
                  {mine && !(members.find((m) => m.id === other)?.venmo) && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[14px] text-mute pointer-events-none">
                        @
                      </span>
                      <input
                        defaultValue=""
                        onBlur={(ev) => {
                          if (ev.target.value.trim()) setMemberVenmo(other, ev.target.value);
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") ev.currentTarget.blur();
                        }}
                        placeholder={`${nameOf(other)}'s venmo — optional`}
                        aria-label={`Venmo handle for ${nameOf(other)}`}
                        autoCapitalize="none"
                        enterKeyHint="done"
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-rule bg-white text-[16px] text-ink min-h-[42px]"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {mine && (
                      <VenmoButton href={link} label={iOwe ? "Pay" : "Request"} />
                    )}
                    <button
                      onClick={() => {
                        setOpenTransfer(null);
                        addSettlement(t.from, t.to, t.cents);
                        showNotice(`Marked ${nameOf(t.from)} → ${nameOf(t.to)} paid`);
                      }}
                      className={`${mine ? "flex-1" : "w-full"} rounded-full border border-rule bg-transparent text-granite cursor-pointer font-mono text-[11px] uppercase tracking-[.07em] py-2 min-h-[38px]`}
                    >
                      Mark paid
                    </button>
                  </div>
                  </div>
                  )}
                </div>
              );
            })}
            {transfers.length > 3 && (
              <button
                onClick={() => setAllTransfers(!allTransfers)}
                className="w-full bg-transparent border-none cursor-pointer text-granite font-mono text-[11px] px-3.5 py-3 min-h-[44px]"
              >
                {allTransfers
                  ? "show fewer"
                  : `show all ${transfers.length} payments`}
              </button>
            )}
          </Card>
        </div>
      )}

      {settled.length > 0 && (
        <div className="mb-5">
          <SubH right={money(settled.reduce((a, x) => a + x.amount_cents, 0))}>
            Already paid back
          </SubH>
          <Card className="overflow-hidden">
            {settled.map((x) => (
              <SwipeRow
                key={x.id}
                className="border-b border-rule last:border-b-0"
                onDelete={() => {
                  const snap = { ...x };
                  deleteSettlement(x.id);
                  showUndo("Removed", () => restoreSettlement(snap));
                }}
              >
                <div className="flex items-center gap-2 px-3.5 py-2.5">
                  <Avatar
                    userId={x.from_member}
                    url={memberAvatars[x.from_member]}
                    name={nameOf(x.from_member)}
                    size={20}
                  />
                  <span className="flex-1 min-w-0 text-[13.5px] text-granite truncate">
                    {nameOf(x.from_member)} paid {nameOf(x.to_member)}
                  </span>
                  <span className="font-mono text-[13px] text-moss shrink-0">
                    {money(x.amount_cents)}
                  </span>
                </div>
              </SwipeRow>
            ))}
          </Card>
        </div>
      )}


      {/* The roster is fixed and correct, so it stopped earning a card of its
          own — but a wrong name or a person added by mistake still has to be
          fixable, so it lives one tap away. */}
      <button
        onClick={() => setRosterOpen(true)}
        className="block mx-auto mt-1 bg-transparent border-none cursor-pointer font-mono text-[10.5px] text-granite underline underline-offset-2"
      >
        {members.length} on the trip
      </button>
      <RosterSheet open={rosterOpen} onClose={() => setRosterOpen(false)} />
    </div>
  );
}
