"use client";

/**
 * Nudges a focused field out from behind the software keyboard — and only then.
 *
 * There used to be three of these, all `block: "center"` and all animated: the
 * ghost add row scrolled itself on focus, every inline editor called a shared
 * helper that did the same, and the page scrolled the active element again when
 * the keyboard resized the viewport. Tapping "Add" fired two of them about
 * 100ms apart, so the page lurched, settled, and lurched again.
 *
 * Two fixes, and the second is what makes the first safe. Centring is the wrong
 * move — a row already comfortably above the keyboard shouldn't travel at all —
 * so this measures first and returns early when there's nothing to do. That
 * makes it idempotent, which means the remaining callers can overlap without
 * fighting: the first one scrolls, the rest see a visible field and stop.
 */
export function keepVisible(el: HTMLElement | null | undefined) {
  if (!el || !el.isConnected) return;
  // The visual viewport is the part not covered by the keyboard. Without one
  // (desktop, older browsers) the layout viewport is the whole story.
  const vv = window.visualViewport;
  const top = vv?.offsetTop ?? 0;
  const bottom = top + (vv?.height ?? window.innerHeight);
  const r = el.getBoundingClientRect();
  // A little air, so the field isn't flush against the keyboard's top edge.
  const pad = 16;
  if (r.top >= top + pad && r.bottom <= bottom - pad) return;
  el.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

/**
 * onFocus handler for an inline field. The delay lets the keyboard finish
 * animating in, so the measurement is taken against the viewport you'll
 * actually have rather than the one you're leaving.
 */
export function onFieldFocus(e: React.FocusEvent<HTMLElement>) {
  const el = e.target;
  setTimeout(() => keepVisible(el), 250);
}
