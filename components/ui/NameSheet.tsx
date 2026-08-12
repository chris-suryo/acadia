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

  const go = () => {
    if (txt.trim()) onSubmit(txt.trim());
  };

  return (
    <BottomSheet open={open} onClose={onCancel}>
      <div className="grid gap-3">
        {onPick && roster.length > 0 && (
          <RosterPick roster={roster} onPick={onPick} />
        )}
        <Input
          // Autofocus only when there's nothing to tap — otherwise the keyboard
          // covers the names we just went to the trouble of offering.
          autoFocus={!roster.length}
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
      </div>
    </BottomSheet>
  );
}
