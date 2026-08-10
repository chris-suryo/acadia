"use client";

// Keeps an inline field visible above the software keyboard.
export function focusCenter(e: React.FocusEvent<HTMLElement>) {
  const el = e.target;
  setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 150);
}
