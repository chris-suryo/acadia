"use client";

// Name gate as a bottom sheet: the first gated action with no name opens it;
// Continue saves the name and the original action completes immediately.

import { useCallback, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Btn, Input } from "@/components/primitives";

export function useNameSheet(hasName: boolean, commitName: (n: string) => void) {
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

  const submit = (n: string) => {
    commitName(n);
    const action = pending;
    setPending(null);
    action?.();
  };

  return {
    ensureName,
    sheetOpen: pending !== null,
    submit,
    cancel: () => setPending(null),
  };
}

export function NameSheet({
  open,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [txt, setTxt] = useState("");

  const go = () => {
    if (txt.trim()) onSubmit(txt.trim());
  };

  return (
    <BottomSheet open={open} onClose={onCancel}>
      <div className="grid gap-3">
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
      </div>
    </BottomSheet>
  );
}
