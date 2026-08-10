"use client";

import { useEffect, useRef, useState } from "react";
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

const TAB_IDS: TabId[] = ["itinerary", "packing", "food", "explore"];

function Shell() {
  const { ready, error } = useData();
  const [tab, setTabState] = useState<TabId>("itinerary");
  const [packView, setPackViewState] = useState("group");
  const [foodView, setFoodViewState] = useState("menu");
  const [highlight, setHighlight] = useState<string | null>(null);
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  // Restore tab + segments from the last visit (mid-Costco-run reopen lands
  // back on Store, not Itinerary).
  useEffect(() => {
    const timer = setTimeout(() => {
      const t = sessionStorage.getItem("abc.tab") as TabId | null;
      if (t && TAB_IDS.includes(t)) setTabState(t);
      const pv = sessionStorage.getItem("abc.packView");
      if (pv) setPackViewState(pv);
      const fv = sessionStorage.getItem("abc.foodView");
      if (fv) setFoodViewState(fv);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const setTab = (t: TabId) => {
    setTabState(t);
    sessionStorage.setItem("abc.tab", t);
  };
  const setPackView = (v: string) => {
    setPackViewState(v);
    sessionStorage.setItem("abc.packView", v);
  };
  const setFoodView = (v: string) => {
    setFoodViewState(v);
    sessionStorage.setItem("abc.foodView", v);
  };

  // Per-tab scroll position.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sessionStorage.setItem(`abc.scroll.${tabRef.current}`, String(window.scrollY));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const v = sessionStorage.getItem(`abc.scroll.${tab}`);
    window.scrollTo(0, v ? parseInt(v, 10) || 0 : 0);
  }, [tab, ready]);

  // Keep the focused inline field visible when the keyboard opens.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const h = () => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA"))
        setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
    };
    vv.addEventListener("resize", h);
    return () => vv.removeEventListener("resize", h);
  }, []);

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
