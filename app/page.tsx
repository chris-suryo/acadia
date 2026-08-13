"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { DataProvider } from "@/lib/data/provider";
import { useData } from "@/lib/data/context";
import { UiProvider } from "@/components/ui/UiProvider";
import { Header } from "@/components/Header";
import { Tabs, type TabId } from "@/components/Tabs";
import { Itinerary } from "@/components/Itinerary";
import { Chirp } from "@/components/Chirp";
import { Packing } from "@/components/Packing";
import { Food } from "@/components/Food";
import { Expenses } from "@/components/Expenses";
import { Explore } from "@/components/Explore";
import { IntroField, IntroMasthead, Welcome } from "@/components/Welcome";
import { ServiceWorker } from "@/components/ServiceWorker";
import { keepVisible } from "@/components/ui/keepVisible";

function Shell() {
  const { ready, error, name, posts, isMe, avatars, queuedWrites } = useData();
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
      // "money" was a Food segment before Expenses became its own tab.
      const fv = sessionStorage.getItem("abc.foodView");
      if (fv && fv !== "money") setFoodViewState(fv);
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

  // Chirp's unread dot: lit while somebody else's newest post is newer than
  // the last one seen on this device. State starts empty and hydrates in an
  // effect so the server render and the first client render agree.
  const [chirpSeen, setChirpSeen] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setChirpSeen(localStorage.getItem("abc.chirpSeen") ?? "");
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (tab !== "chirp" || !ready) return;
    const newest = posts.map((p) => p.created_at).sort().at(-1) ?? "";
    if (!newest) return;
    const timer = setTimeout(() => {
      if (newest > (localStorage.getItem("abc.chirpSeen") ?? ""))
        localStorage.setItem("abc.chirpSeen", newest);
      setChirpSeen((cur) => (newest > cur ? newest : cur));
    }, 0);
    return () => clearTimeout(timer);
  }, [tab, ready, posts]);
  const chirpDot =
    tab !== "chirp" &&
    posts.some((p) => !isMe(p.user_id) && p.created_at > chirpSeen);

  /**
   * Push everyone's face into the offline cache as soon as we know them.
   *
   * The service worker's precache list is static trip imagery, so avatars were
   * never in it — and a tab switch unmounts its <img> elements, so every
   * return to a tab re-requested twelve photos from storage. On campground
   * signal that reads as faces fading in each time. They're a few KB each and
   * they belong on disk; the worker skips whatever it already holds.
   */
  const avatarKey = Object.values(avatars).sort().join("|");
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const urls = [...new Set(Object.values(avatars))].filter((u) =>
      u.startsWith("http"),
    );
    if (!urls.length) return;
    let cancelled = false;
    navigator.serviceWorker.ready.then((reg) => {
      if (!cancelled) reg.active?.postMessage({ type: "precache", urls });
    });
    return () => {
      cancelled = true;
    };
    // Keyed by the URLs themselves — `avatars` is rebuilt on every profile
    // refetch, and re-sending an unchanged list on each one is pure noise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarKey]);

  // Keep the focused inline field visible when the keyboard opens. The field's
  // own onFocus handler usually gets there first; this covers the case where
  // the keyboard appears late, and `keepVisible` no-ops when there's nothing
  // to do, so the two can't fight each other into a lurch.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const h = () => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) keepVisible(el);
    };
    vv.addEventListener("resize", h);
    return () => vv.removeEventListener("resize", h);
  }, []);

  const jump = (slug: string) => {
    setHighlight(slug);
    setTab("explore");
  };

  // Until the data layer answers we can't know whether this is a first open, so
  // the shell would otherwise paint first — header, spinner, and a tab bar
  // nobody can use — and then hard-swap to the full-bleed intro. Hold the same
  // pine field the intro opens on instead, and the hand-off is silent.
  if (!ready && !error) {
    return (
      <IntroField>
        <IntroMasthead />
      </IntroField>
    );
  }

  if (showWelcome && !error) {
    return (
      <Welcome
        onDone={() => {
          localStorage.setItem("abc.welcomed", "1");
          setShowWelcome(false);
          // Finishing the intro means starting the trip, wherever it was
          // replayed from — a replay launched off Explore used to drop you
          // back on Explore.
          setTab("itinerary");
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
            {tab === "chirp" && <Chirp />}
            {tab === "packing" && <Packing view={packView} setView={setPackView} />}
            {tab === "food" && <Food view={foodView} setView={setFoodView} />}
            {tab === "expenses" && <Expenses />}
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
      {/* Changes made without signal stay on screen and keep trying. Saying so
          is the difference between "it worked" and "did that save?" — and at
          Blackwoods this is the normal state, not the error state. */}
      {queuedWrites > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-40 flex justify-center pointer-events-none">
          <span className="mb-2 rounded-full bg-ink/85 text-parchment px-3 py-1.5 font-mono text-[11px] shadow-[0_2px_8px_rgba(0,0,0,.2)]">
            {queuedWrites} {queuedWrites === 1 ? "change" : "changes"} waiting for signal
          </span>
        </div>
      )}
      <Tabs tab={tab} onChange={setTab} dot={{ chirp: chirpDot }} />
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
