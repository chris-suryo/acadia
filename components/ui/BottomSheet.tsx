"use client";

import { useEffect } from "react";

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

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-2xl border-t border-rule p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,.18)]">
        <div className="max-w-[400px] mx-auto">{children}</div>
      </div>
    </div>
  );
}
