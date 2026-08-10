"use client";

// Swipe-left to delete: past the threshold the row commits its delete on
// release (callers pair it with an undo snackbar). Vertical scrolling stays
// native via touch-action: pan-y; a swipe suppresses the row's tap action.

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

const COMMIT_AT = -64;
const MAX_PULL = -96;

export function SwipeRow({
  onDelete,
  children,
  className = "",
  disabled = false,
}: {
  onDelete: () => void;
  children: React.ReactNode;
  className?: string;
  /** Suppresses the swipe gesture (e.g. while a drag-reorder is active). */
  disabled?: boolean;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const axis = useRef<"none" | "x" | "y">("none");
  const swiped = useRef(false);

  const reset = () => {
    start.current = null;
    axis.current = "none";
    setDragging(false);
    setDx(0);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-24 bg-blaze flex items-center justify-end pr-4"
        style={{ opacity: dx < -8 ? 1 : 0 }}
      >
        <Trash2 size={16} color="#fff" />
      </div>
      <div
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? "none" : "transform .15s",
          touchAction: "pan-y",
        }}
        onPointerDown={(e) => {
          if (disabled) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;
          start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          axis.current = "none";
          swiped.current = false;
        }}
        onPointerMove={(e) => {
          if (disabled) {
            if (start.current) reset();
            return;
          }
          const s = start.current;
          if (!s || e.pointerId !== s.id) return;
          const mx = e.clientX - s.x;
          const my = e.clientY - s.y;
          if (axis.current === "none") {
            if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
            axis.current = Math.abs(mx) > Math.abs(my) ? "x" : "y";
            if (axis.current === "x") {
              setDragging(true);
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }
          }
          if (axis.current === "x") {
            swiped.current = true;
            setDx(Math.max(MAX_PULL, Math.min(0, mx)));
          }
        }}
        onPointerUp={() => {
          if (axis.current === "x" && dx <= COMMIT_AT) onDelete();
          reset();
        }}
        onPointerCancel={reset}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
          }
        }}
        className="relative bg-card"
      >
        {children}
      </div>
    </div>
  );
}
