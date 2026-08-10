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

export function Tabs({
  tab,
  onChange,
}: {
  tab: TabId;
  onChange: (t: TabId) => void;
}) {
  return (
    <nav className="flex bg-card border-b border-rule sticky top-0 z-10">
      {TABS.map(({ id, label, Icon }) => {
        const on = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-1.5 py-[13px] bg-transparent border-x-0 border-t-0 border-b-[3px] text-[13.5px] cursor-pointer min-h-[48px] ${
              on
                ? "border-blaze text-ink font-semibold"
                : "border-transparent text-mute font-medium"
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
