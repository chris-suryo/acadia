"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, Input } from "./primitives";
import { SwipeRow } from "./ui/SwipeRow";
import { useUi } from "./ui/UiProvider";
import { useData } from "@/lib/data/context";
import { PARTY_SIZE } from "@/lib/config";

function ExpenseAdd({ onCommit }: { onCommit: (desc: string, cents: number) => void }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");

  const commit = () => {
    const a = parseFloat(amt);
    if (!desc.trim() || isNaN(a) || a < 0) return;
    onCommit(desc.trim(), Math.round(a * 100));
    setDesc("");
    setAmt("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 w-full text-left bg-transparent border-none cursor-pointer text-granite text-[13px] px-3.5 py-[11px] min-h-[44px]"
      >
        <Plus size={14} /> Add
      </button>
    );
  }

  return (
    <div
      className="flex gap-2 px-3.5 py-2"
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        if (!desc.trim() && !amt.trim()) setOpen(false);
        else commit();
      }}
    >
      <Input
        autoFocus
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="What you bought"
        enterKeyHint="next"
        className="min-h-[42px] p-2.5"
      />
      <Input
        value={amt}
        onChange={(e) => setAmt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="0.00"
        inputMode="decimal"
        enterKeyHint="done"
        className="w-24 min-h-[42px] p-2.5"
      />
    </div>
  );
}

/** Settling up. Its own tab since Chris flagged it: deciding what to eat and
 *  working out who owes whom are different jobs on different days. */
export function Expenses() {
  const {
    expenses,
    profiles,
    userId,
    ensureName,
    addExpense,
    deleteExpense,
    restoreExpense,
  } = useData();
  const { showUndo } = useUi();

  const myPaid = expenses
    .filter((e) => e.user_id === userId)
    .reduce((s, e) => s + e.amount_cents, 0);
  const total = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const sortedExpenses = [...expenses].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  return (
    <div className="px-3.5 pt-4 pb-[60px]">
      <Card className="overflow-hidden">
        {sortedExpenses.length === 0 && (
          <div className="p-5 text-[13.5px] text-mute text-center border-b border-rule">
            No expenses logged.
          </div>
        )}
        {sortedExpenses.map((e) => {
          const who = profiles[e.user_id]?.trim() || "";
          const row = (
            <div className="flex items-center gap-2.5 px-3.5 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-ink">{e.description}</div>
                {who && (
                  <div className="font-mono text-[10.5px] text-moss mt-0.5">
                    {who}
                  </div>
                )}
              </div>
              <div className="font-mono text-[14px] text-ink font-medium">
                ${(e.amount_cents / 100).toFixed(2)}
              </div>
            </div>
          );
          return e.user_id === userId ? (
            <SwipeRow
              key={e.id}
              className="border-b border-rule"
              onDelete={() => {
                const snap = { ...e };
                deleteExpense(e.id);
                showUndo("Deleted", () => restoreExpense(snap));
              }}
            >
              {row}
            </SwipeRow>
          ) : (
            <div key={e.id} className="border-b border-rule">
              {row}
            </div>
          );
        })}
        <ExpenseAdd
          onCommit={(desc, cents) => ensureName(() => addExpense(desc, cents))}
        />
        {sortedExpenses.length > 0 && (
          <div className="px-3.5 py-3 bg-[#F2EFE3] border-t border-rule">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-granite">
                ${(total / 100 / PARTY_SIZE).toFixed(2)} each, split {PARTY_SIZE}{" "}
                ways
              </span>
              <span className="font-mono text-[15px] text-ink font-semibold">
                ${(total / 100).toFixed(2)}
              </span>
            </div>
            {myPaid > 0 && (
              <div className="text-right font-mono text-[11px] text-granite mt-1">
                you&apos;ve paid ${(myPaid / 100).toFixed(2)}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
