"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Welcome } from "@/components/Welcome";
import { ServiceWorker } from "@/components/ServiceWorker";

function Shell() {
  const { ready, error, name } = useData();
  const [tab, setTab] = useState<TabId>("itinerary");
  const [packView, setPackViewState] = useState("group");
  const [foodView, setFoodViewState] = useState("menu");
  const [exploreView, setExploreViewState] = useState("park");
  const [highlight, setHighlight] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const welcomeChecked = useRef(false);
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  // First open on this device with no saved name → the intro. Decided once
  // per visit when data is ready; Welcome stays mounted through its own
  // steps (setName mid-flow must not unmount it). ?welcome=1 forces it.
  useEffect(() => {
    if (!ready || welcomeChecked.current) return;
    welcomeChecked.current = true;
    const noName = !name.trim();
    const timer = setTimeout(() => {
      const forced = new URLSearchParams(window.location.search).has("welcome");
      if (forced || (noName && !localStorage.getItem("abc.welcomed")))
        setShowWelcome(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [ready, name]);

  // Cold open always lands on the schedule; per-tab segments restore from
  // the last visit.
  useEffect(() => {
    const timer = setTimeout(() => {
      const pv = sessionStorage.getItem("abc.packView");
      if (pv) setPackViewState(pv);
      const fv = sessionStorage.getItem("abc.foodView");
      if (fv) setFoodViewState(fv);
      const ev = sessionStorage.getItem("abc.exploreView");
      if (ev) setExploreViewState(ev);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  // Stable identities: Explore's jump effect lists these as deps.
  const setExploreView = useCallback((v: string) => {
    setExploreViewState(v);
    sessionStorage.setItem("abc.exploreView", v);
  }, []);
  const clearHighlight = useCallback(() => setHighlight(null), []);
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

  if (showWelcome && ready && !error) {
    return (
      <Welcome
        onDone={() => {
          localStorage.setItem("abc.welcomed", "1");
          setShowWelcome(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Header />
      <main className="max-w-[640px] mx-auto pb-[calc(72px+env(safe-area-inset-bottom))]">
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
                clearHighlight={clearHighlight}
                onReplayIntro={() => setShowWelcome(true)}
                view={exploreView}
                setView={setExploreView}
              />
            )}
          </>
        )}
      </main>
      <Tabs tab={tab} onChange={setTab} />
    </div>
  );
}

export default function Page() {
  return (
    <UiProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
      <ServiceWorker />
    </UiProvider>
  );
}
