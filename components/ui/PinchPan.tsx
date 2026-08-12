"use client";

// Pinch-zoom + drag-pan on a surface. The app disables the browser's own
// pinch (viewport user-scalable=no), so the gesture has to be ours: pointer
// events, two fingers scale about their midpoint, one finger pans, and a
// double-tap toggles between fit and a closer look at the tapped point.

import { useCallback, useRef, useState } from "react";

export type Transform = { scale: number; x: number; y: number };

const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 24;

export function usePinchPan({
  min = 1,
  max = 6,
  doubleTapScale = 3,
}: { min?: number; max?: number; doubleTapScale?: number } = {}) {
  const [t, setT] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const surface = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const moved = useRef(0);

  const clamp = useCallback(
    (next: Transform): Transform => {
      const el = surface.current;
      const scale = Math.min(max, Math.max(min, next.scale));
      if (!el) return { ...next, scale };
      // Content is laid out to fit the surface at scale 1, so the overflow at
      // a given scale is what we're allowed to pan across.
      const bx = (el.clientWidth * (scale - 1)) / 2;
      const by = (el.clientHeight * (scale - 1)) / 2;
      return {
        scale,
        x: Math.min(bx, Math.max(-bx, next.x)),
        y: Math.min(by, Math.max(-by, next.y)),
      };
    },
    [min, max],
  );

  /** Scales about a point given in surface coordinates. */
  const zoomTo = useCallback(
    (scale: number, px: number, py: number) => {
      setT((prev) => {
        const el = surface.current;
        if (!el) return clamp({ ...prev, scale });
        const cx = el.clientWidth / 2;
        const cy = el.clientHeight / 2;
        const k = scale / prev.scale;
        return clamp({
          scale,
          x: px - cx - (px - cx - prev.x) * k,
          y: py - cy - (py - cy - prev.y) * k,
        });
      });
    },
    [clamp],
  );

  const reset = useCallback(() => setT({ scale: 1, x: 0, y: 0 }), []);

  const local = (e: React.PointerEvent) => {
    const r = surface.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 1) moved.current = 0;
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: t.scale };
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const prev = pointers.current.get(e.pointerId);
      if (!prev) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size >= 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.current.dist > 0) {
          const r = surface.current?.getBoundingClientRect();
          const mx = (a.x + b.x) / 2 - (r?.left ?? 0);
          const my = (a.y + b.y) / 2 - (r?.top ?? 0);
          zoomTo((dist / pinch.current.dist) * pinch.current.scale, mx, my);
        }
        return;
      }

      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      moved.current += Math.abs(dx) + Math.abs(dy);
      setT((cur) => clamp({ ...cur, x: cur.x + dx, y: cur.y + dy }));
    },
    onPointerUp: (e: React.PointerEvent) => {
      const wasPinching = pointers.current.size >= 2;
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
      if (wasPinching || moved.current > DOUBLE_TAP_SLOP) return;

      const { x, y } = local(e);
      const now = Date.now();
      const l = lastTap.current;
      if (
        l &&
        now - l.t < DOUBLE_TAP_MS &&
        Math.hypot(x - l.x, y - l.y) < DOUBLE_TAP_SLOP
      ) {
        lastTap.current = null;
        if (t.scale > min + 0.05) reset();
        else zoomTo(doubleTapScale, x, y);
        return;
      }
      lastTap.current = { t: now, x, y };
    },
    onPointerCancel: (e: React.PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
    },
  };

  return { t, setT, surface, handlers, reset, zoomTo, clamp };
}

/** Applies a transform to its children; the parent supplies sizing. */
export function PinchSurface({
  t,
  surface,
  handlers,
  className = "",
  style,
  children,
}: {
  t: Transform;
  surface: React.RefObject<HTMLDivElement | null>;
  handlers: React.ComponentProps<"div">;
  className?: string;
  /** Sizing the parent can't express in a class — the crop frame is measured
   *  in px so `save()` can divide by it. */
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={surface}
      {...handlers}
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: "none", ...style }}
    >
      <div
        className="w-full h-full"
        style={{
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
