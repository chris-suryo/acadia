"use client";

import { useEffect, useRef } from "react";

// The undo toast floats above the sheets on purpose — an undo you can't reach
// is worse than no undo. But "above" at the same bottom edge means sitting on
// top of the sheet's own last row and its Done button, which is how removing
// someone from the roster briefly left no way to close the sheet. So an open
// sheet publishes its height and the toast rides just above it.
const panels = new Set<HTMLElement>();
function publishSheetHeight() {
  let h = 0;
  for (const el of panels) h = Math.max(h, el.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--sheet-h", `${Math.round(h)}px`);
}

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Escape closes — the scrim is the only other way out.
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  // Freeze the page behind the sheet: scrolling it while a sheet is up reads
  // as the sheet failing to catch the gesture.
  useEffect(() => {
    if (!open) return;
    const { overflow, touchAction } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.touchAction = touchAction;
    };
  }, [open]);

  // Its height moves with its content — a settle-up list grows as rows are
  // marked paid — so it's measured, not assumed.
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    panels.add(el);
    publishSheetHeight();
    const ro = new ResizeObserver(publishSheetHeight);
    ro.observe(el);
    return () => {
      ro.disconnect();
      panels.delete(el);
      publishSheetHeight();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        ref={panel}
        className="absolute inset-x-0 bottom-0 bg-card rounded-t-2xl border-t border-rule p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,.18)]"
      >
        <div className="max-w-[400px] mx-auto">{children}</div>
      </div>
    </div>
  );
}
