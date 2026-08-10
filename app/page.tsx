"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DataProvider } from "@/lib/data/provider";
import { useData } from "@/lib/data/context";
import { UiProvider } from "@/components/ui/UiProvider";
import { Header } from "@/components/Header";
import { Tabs, type TabId } from "@/components/Tabs";
import { Itinerary } from "@/components/Itinerary";
import { Packing } from "@/components/Packing";
import { Food } from "@/components/Food";
import { Explore } from "@/components/Explore";

function Shell() {
  const { ready, error } = useData();
  const [tab, setTab] = useState<TabId>("itinerary");
  const [packView, setPackView] = useState("group");
  const [foodView, setFoodView] = useState("menu");
  const [highlight, setHighlight] = useState<string | null>(null);

  const jump = (slug: string) => {
    setHighlight(slug);
    setTab("explore");
  };

  return (
    <div className="min-h-screen bg-parchment">
      <Header />
      <Tabs tab={tab} onChange={setTab} />
      <main className="max-w-[640px] mx-auto">
        {error ? (
          <div className="p-[70px_20px] text-center font-mono text-[12px] text-granite">
            {error}
          </div>
        ) : !ready ? (
          <div className="flex items-center justify-center gap-[9px] p-[70px] text-granite text-[14px]">
            <Loader2 size={16} className="spin" /> Loading…
          </div>
        ) : (
          <>
            {tab === "itinerary" && <Itinerary jump={jump} />}
            {tab === "packing" && <Packing view={packView} setView={setPackView} />}
            {tab === "food" && <Food view={foodView} setView={setFoodView} />}
            {tab === "explore" && (
              <Explore
                highlight={highlight}
                clearHighlight={() => setHighlight(null)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <UiProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </UiProvider>
  );
}
