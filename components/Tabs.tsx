"use client";

import {
  Backpack,
  Compass,
  Map as MapIcon,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type TabId = "itinerary" | "packing" | "food" | "explore";

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: "itinerary", label: "Itinerary", Icon: Compass },
  { id: "packing", label: "Packing", Icon: Backpack },
  { id: "food", label: "Food", Icon: UtensilsCrossed },
  { id: "explore", label: "Explore", Icon: MapIcon },
];

// Bottom tab bar, iPhone-app style: icon over label, color-shift active
// state, safe-area padding for the home indicator.
export function Tabs({
  tab,
  onChange,
}: {
  tab: TabId;
  onChange: (t: TabId) => void;
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex bg-card border-t border-rule pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ id, label, Icon }) => {
        const on = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 px-1 pt-2.5 pb-2 bg-transparent border-none cursor-pointer min-h-[56px] ${
              on ? "text-blaze" : "text-mute"
            }`}
          >
            <Icon size={20} />
            <span className={`text-[10.5px] ${on ? "font-semibold" : "font-medium"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
