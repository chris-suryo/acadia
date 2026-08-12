"use client";

// Name gate as a bottom sheet: the first gated action with no name opens it;
// Continue saves the name and the original action completes immediately.

import { useCallback, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { RosterPick } from "./RosterPick";
import { Btn, Input } from "@/components/primitives";
import type { Member } from "@/lib/types";

export function useNameSheet(
  hasName: boolean,
  commitName: (n: string) => void,
  commitMember?: (memberId: string) => void,
) {
  const [pending, setPending] = useState<(() => void) | null>(null);

  const ensureName = useCallback(
    (action: () => void) => {
      if (hasName) {
        action();
        return;
      }
      setPending(() => action);
    },
    [hasName],
  );

  const run = () => {
    const action = pending;
    setPending(null);
    action?.();
  };

  return {
    ensureName,
    sheetOpen: pending !== null,
    submit: (n: string) => {
      commitName(n);
      run();
    },
    /** Tapped a name already on the roster — same gate, no typing. */
    submitMember: (memberId: string) => {
      commitMember?.(memberId);
      run();
    },
    cancel: () => setPending(null),
  };
}

export function NameSheet({
  open,
  onSubmit,
  onCancel,
  roster = [],
  onPick,
}: {
  open: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  roster?: Member[];
  onPick?: (memberId: string) => void;
}) {
  const [txt, setTxt] = useState("");
  const [typing, setTyping] = useState(false);
  const picking = !!onPick && roster.length > 0;

  const go = () => {
    if (txt.trim()) onSubmit(txt.trim());
  };

  return (
    <BottomSheet open={open} onClose={onCancel}>
      <div className="grid gap-3">
        {picking && !typing && (
          <>
            <RosterPick roster={roster} onPick={onPick} />
            {/* The list is the whole party, so typing a name is the exception,
                not the default — left as the default it's how a twelfth
                phantom person gets invented. */}
            <button
              onClick={() => setTyping(true)}
              className="bg-transparent border-none cursor-pointer p-0 text-left font-mono text-[10.5px] text-blaze underline underline-offset-2"
            >
              not on the list?
            </button>
          </>
        )}
        {(!picking || typing) && (
          <>
            <Input
              autoFocus
              value={txt}
              onChange={(e) => setTxt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") go();
              }}
              placeholder="Your name"
              aria-label="Your name"
              enterKeyHint="done"
            />
            <Btn onClick={go} full>
              Continue
            </Btn>
            {picking && (
              <button
                onClick={() => setTyping(false)}
                className="bg-transparent border-none cursor-pointer p-0 font-mono text-[10.5px] text-granite underline underline-offset-2"
              >
                back to the list
              </button>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
