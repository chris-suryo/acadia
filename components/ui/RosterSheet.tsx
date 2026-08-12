"use client";

// Who's on the trip, and their Venmo handles.
//
// This used to be a card at the bottom of the Expenses tab, which was dead
// weight once the roster was right — everyone already knows who's coming. It's
// still reachable because a name typed wrong or a person added by mistake has
// to be fixable, and because a missing Venmo handle is worth filling in when
// you happen to know it.

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Avatar } from "./Avatar";
import { AddRow } from "./AddRow";
import { SwipeRow } from "./SwipeRow";
import { Btn } from "@/components/primitives";
import { useUi } from "./UiProvider";
import { useData } from "@/lib/data/context";

const FIELD =
  "p-2.5 rounded-lg border border-rule bg-white text-[16px] text-ink min-h-[42px]";

export function RosterSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    members,
    memberAvatars,
    myMemberId,
    expenses,
    expenseShares,
    settlements,
    addMember,
    restoreMember,
    renameMember,
    setMemberVenmo,
    deleteMember,
  } = useData();
  const { showUndo, showNotice } = useUi();
  const [editing, setEditing] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [venmoDraft, setVenmoDraft] = useState("");

  /** Rows pinning a member — the database refuses to drop one that's in use. */
  const usage = (id: string) =>
    expenses.filter(
      (e) =>
        e.payer_id === id ||
        expenseShares.some((s) => s.expense_id === e.id && s.member_id === id),
    ).length +
    settlements.filter((x) => x.from_member === id || x.to_member === id).length;

  const commit = () => {
    const id = editing;
    setEditing(null);
    if (!id) return;
    const m = members.find((x) => x.id === id);
    if (!m) return;
    if (nameDraft.trim() && nameDraft.trim() !== m.name) renameMember(id, nameDraft);
    if (venmoDraft.trim().replace(/^@/, "") !== m.venmo) setMemberVenmo(id, venmoDraft);
  };

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        commit();
        onClose();
      }}
    >
      <div className="grid gap-3">
        <div className="font-mono text-[10.5px] tracking-[.1em] uppercase text-granite">
          Who&apos;s on the trip
        </div>
        <div className="max-h-[52vh] overflow-y-auto -mx-1 px-1">
          {members.map((m) => {
            if (editing === m.id) {
              return (
                <div key={m.id} className="grid gap-2 py-2">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commit();
                    }}
                    aria-label="Name"
                    enterKeyHint="next"
                    className={`${FIELD} w-full`}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[15px] text-mute pointer-events-none">
                      @
                    </span>
                    <input
                      value={venmoDraft}
                      onChange={(e) => setVenmoDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commit();
                      }}
                      placeholder="venmo handle — optional"
                      aria-label="Venmo handle"
                      autoCapitalize="none"
                      enterKeyHint="done"
                      className={`${FIELD} w-full pl-7`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Btn small onClick={commit}>
                      Done
                    </Btn>
                  </div>
                </div>
              );
            }
            const n = usage(m.id);
            return (
              <SwipeRow
                key={m.id}
                className="border-b border-rule last:border-b-0"
                onDelete={() => {
                  // Removing someone mid-ledger would rewrite everyone's
                  // balance without saying so.
                  if (n > 0) {
                    showNotice(`${m.name} is on ${n} row${n > 1 ? "s" : ""}`);
                    return;
                  }
                  // Re-adding by name would mint a new id and quietly split
                  // one person into two; the row goes back as it was.
                  const snap = { ...m };
                  deleteMember(m.id);
                  showUndo("Removed", () => restoreMember(snap));
                }}
              >
                <button
                  onClick={() => {
                    setNameDraft(m.name);
                    setVenmoDraft(m.venmo);
                    setEditing(m.id);
                  }}
                  className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-2.5 py-2.5"
                >
                  <Avatar userId={m.id} url={memberAvatars[m.id]} name={m.name} size={26} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] text-ink truncate">{m.name}</span>
                    {m.venmo && (
                      <span className="block font-mono text-[10.5px] text-moss truncate">
                        @{m.venmo}
                      </span>
                    )}
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
        </div>
        <div className="-mx-1">
          <AddRow label="Add someone" placeholder="Their name" onAdd={(t) => addMember(t)} />
        </div>
        <Btn
          onClick={() => {
            commit();
            onClose();
          }}
          full
        >
          Done
        </Btn>
      </div>
    </BottomSheet>
  );
}
