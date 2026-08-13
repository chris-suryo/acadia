"use client";

import {
  Backpack,
  Bird,
  Compass,
  Map as MapIcon,
  Receipt,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type TabId =
  | "itinerary"
  | "chirp"
  | "packing"
  | "food"
  | "expenses"
  | "explore";

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: "itinerary", label: "Itinerary", Icon: Compass },
  // Second slot: during the trip the two live tabs are the schedule and the
  // feed. Six tabs get 65px each at 390px; the longest label measures about
  // 50px, so nothing truncates.
  { id: "chirp", label: "Chirp", Icon: Bird },
  { id: "packing", label: "Packing", Icon: Backpack },
  { id: "food", label: "Food", Icon: UtensilsCrossed },
  { id: "expenses", label: "Expenses", Icon: Receipt },
  { id: "explore", label: "Explore", Icon: MapIcon },
];

// Bottom tab bar, iPhone-app style: icon over label, color-shift active
// state, safe-area padding for the home indicator.
export function Tabs({
  tab,
  onChange,
  dot,
}: {
  tab: TabId;
  onChange: (t: TabId) => void;
  /** Unread marks by tab — a small blaze dot on the icon. */
  dot?: Partial<Record<TabId, boolean>>;
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex bg-card border-t border-rule pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ id, label, Icon }) => {
        const on = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={on ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-1 px-1 pt-2.5 pb-2 bg-transparent border-none cursor-pointer min-h-[56px] ${
              on ? "text-blaze" : "text-mute"
            }`}
          >
            <span className="relative">
              <Icon size={20} />
              {dot?.[id] ? (
                <span
                  data-testid={`dot-${id}`}
                  className="absolute -top-0.5 -right-1 w-[7px] h-[7px] rounded-full bg-blaze border border-card"
                />
              ) : null}
            </span>
            <span className={`text-[10.5px] ${on ? "font-semibold" : "font-medium"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
