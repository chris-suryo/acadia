"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Toast = { label: string; onUndo?: () => void };

const UiCtx = createContext<{
  showUndo: (label: string, onUndo: () => void) => void;
  showNotice: (label: string) => void;
} | null>(null);

export function useUi() {
  const v = useContext(UiCtx);
  if (!v) throw new Error("useUi outside UiProvider");
  return v;
}

const UNDO_MS = 5000;
const NOTICE_MS = 3000;

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const show = useCallback((t: Toast, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(t);
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const showUndo = useCallback(
    (label: string, onUndo: () => void) => show({ label, onUndo }, UNDO_MS),
    [show],
  );
  const showNotice = useCallback((label: string) => show({ label }, NOTICE_MS), [show]);

  const dismiss = () => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  };

  return (
    <UiCtx.Provider value={{ showUndo, showNotice }}>
      {children}
      {/* Above the sheets, not below them. Swipe-to-delete works inside a
          bottom sheet — the settle-up lives in one — and at z-40 the Undo sat
          under the sheet's own scrim: visible, and impossible to tap. An undo
          you can't reach is worse than no undo, because you stop checking.
          `--sheet-h` (published by BottomSheet) lifts it clear of the open
          sheet, so being on top never means being in the way. */}
      {toast && (
        <div
          className="fixed inset-x-3.5 z-[60] flex justify-center transition-[bottom] duration-200"
          style={{ bottom: "calc(var(--sheet-h, 0px) + 16px)" }}
        >
          <div className="flex items-center gap-4 bg-ink text-parchment rounded-lg shadow-[0_4px_16px_rgba(0,0,0,.25)] pl-4 pr-2 py-2 max-w-[400px] w-full">
            <span className="flex-1 text-[13px]">{toast.label}</span>
            {toast.onUndo && (
              <button
                onClick={() => {
                  toast.onUndo?.();
                  dismiss();
                }}
                className="bg-transparent border-none cursor-pointer text-blaze font-semibold text-[13px] px-2 py-1.5 min-h-[36px]"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </UiCtx.Provider>
  );
}
