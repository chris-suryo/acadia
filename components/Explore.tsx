"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Map as MapIcon } from "lucide-react";
import { Card, Segmented, SubH } from "./primitives";
import { EATS, EATS_DIRECTORY, GUIDES, LINKS, MAP_PDF_URL, SPOTS, type Spot } from "@/lib/content";
import { MapOverlay, useMapPrefetch } from "./MapLightbox";
import { Difficulty } from "./ui/Difficulty";

// Source favicon via Google's service — resolves on the client (phones have
// internet); a failed load hides itself and the label stands alone.
export function Favicon({ url, size = 14 }: { url: string; size?: number }) {
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {
    return null;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 14px favicon; next/image is overkill
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="rounded-[3px] shrink-0"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export function Explore({
  highlight,
  clearHighlight,
  onReplayIntro,
  view,
  setView,
}: {
  highlight: string | null;
  clearHighlight: () => void;
  onReplayIntro: () => void;
  view: string;
  setView: (v: string) => void;
}) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [photoOf, setPhotoOf] = useState<Spot | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  useMapPrefetch();

  // A details↗ jump lands on the segment its spot lives in, then scrolls.
  useEffect(() => {
    if (!highlight) return;
    const zone = SPOTS.find((s) => s.id === highlight)?.zone;
    if (zone) setView(zone);
    const scrollT = setTimeout(() => {
      refs.current[highlight]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    const clearT = setTimeout(clearHighlight, 2500);
    return () => {
      clearTimeout(scrollT);
      clearTimeout(clearT);
    };
  }, [highlight, clearHighlight, setView]);

  const Row = ({ p, last }: { p: Spot; last: boolean }) => (
    <div
      ref={(el) => {
        refs.current[p.id] = el;
      }}
      className={`px-3.5 py-[13px] transition-[background] duration-500 ${
        last ? "" : "border-b border-rule"
      } ${highlight === p.id ? "bg-[#FBEFE4]" : "bg-transparent"}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-semibold text-ink">{p.name}</div>
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-blaze mt-[3px]">
            {p.difficulty && <Difficulty level={p.difficulty} />}
            {p.meta}
          </div>
        </div>
        {p.photo && (
          <button
            onClick={() => setPhotoOf(p)}
            aria-label={`Photo — ${p.name}`}
            className="shrink-0 p-0 bg-transparent border-none cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- storage-hosted thumb */}
            <img
              src={p.photo.src}
              alt=""
              loading="lazy"
              className="w-16 h-16 rounded-lg object-cover border border-rule"
            />
          </button>
        )}
      </div>
      <div className="text-[12.5px] text-granite leading-[1.55] mt-[5px]">{p.note}</div>
      {p.links.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
          {p.links.map((l) => (
            <a
              key={l.url + l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blaze no-underline"
            >
              <Favicon url={l.url} /> {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const park = SPOTS.filter((s) => s.zone === "park");
  const town = SPOTS.filter((s) => s.zone === "town");

  return (
    <div className="px-3.5 pt-4 pb-[60px]">
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { id: "park", label: "Park" },
          { id: "town", label: "Town" },
          { id: "info", label: "Info" },
        ]}
      />

      {view === "park" && (
        <div className="mb-[22px]">
          <SubH>In the park</SubH>
          <Card>
            {park.map((p, i) => (
              <Row key={p.id} p={p} last={i === park.length - 1} />
            ))}
          </Card>
        </div>
      )}

      {view === "town" && (
        <>
          <div className="mb-[22px]">
            <SubH>Bar Harbor & nearby</SubH>
            <Card>
              {town.map((p, i) => (
                <Row key={p.id} p={p} last={i === town.length - 1} />
              ))}
            </Card>
          </div>
        </>
      )}

      {view === "info" && (
        <div className="mb-[22px]">
          <SubH>Campground</SubH>
          <Card className="flex items-center gap-[11px] p-[13px]">
            <button
              onClick={() => setMapOpen(true)}
              className="flex-1 min-w-0 flex items-center gap-[11px] text-left bg-transparent border-none p-0 cursor-pointer"
            >
              <MapIcon size={19} className="text-blaze shrink-0" />
              <span className="min-w-0">
                <span className="block text-[14.5px] font-semibold text-ink">
                  Blackwoods loop map
                </span>
                <span className="block font-mono text-[10.5px] text-mute mt-0.5">
                  tap to open · site numbers on it
                </span>
              </span>
            </button>
            <a
              href={MAP_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 shrink-0 text-[12px] font-semibold text-blaze no-underline"
            >
              PDF <ExternalLink size={11} />
            </a>
          </Card>
        </div>
      )}

      {view === "town" && (
      <div className="mb-[22px]">
        <SubH right="call ahead — none reserve for 12">Eat with a group</SubH>
        <Card>
          {EATS.map((e) => (
            <div
              key={e.name}
              className="flex items-center gap-3 px-3.5 py-[11px] border-b border-rule"
            >
              <a
                href={e.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 no-underline"
              >
                <span className="text-[14px] font-medium text-blaze underline decoration-[#E5C9B4] underline-offset-[3px]">
                  {e.name}
                </span>
                <span className="block font-mono text-[10.5px] text-mute mt-0.5">
                  {e.street} · {e.meta}
                </span>
              </a>
              <span className="inline-flex items-center gap-3 shrink-0">
                <a
                  href={e.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blaze no-underline"
                >
                  <Favicon url={e.maps} /> maps
                </a>
                {e.site && (
                  <a
                    href={e.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blaze no-underline"
                  >
                    <Favicon url={e.site} /> site
                  </a>
                )}
              </span>
            </div>
          ))}
          <a
            href={EATS_DIRECTORY.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[11px] px-3.5 py-[13px] no-underline"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-blaze underline decoration-[#E5C9B4] underline-offset-[3px]">
                {EATS_DIRECTORY.label}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-mute mt-0.5">
                <Favicon url={EATS_DIRECTORY.url} size={12} /> {EATS_DIRECTORY.domain}
              </div>
            </div>
            <ExternalLink size={14} className="text-mute shrink-0" />
          </a>
        </Card>
      </div>
      )}

      {view === "info" && (
      <div className="mb-[22px]">
        <SubH>Guides</SubH>
        <Card>
          {GUIDES.map((g, i) => (
            <a
              key={g.url}
              href={g.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block px-3.5 py-[13px] no-underline ${
                i < GUIDES.length - 1 ? "border-b border-rule" : ""
              }`}
            >
              <div className="flex justify-between items-baseline gap-2.5">
                <span className="text-[14px] font-medium text-blaze underline decoration-[#E5C9B4] underline-offset-[3px]">
                  {g.name}
                </span>
                <ExternalLink size={12} className="text-mute shrink-0" />
              </div>
              <div className="text-[12px] text-granite mt-[3px] leading-[1.5]">
                {g.why}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-mute mt-0.5">
                <Favicon url={g.url} size={12} /> {g.domain}
              </div>
            </a>
          ))}
        </Card>
      </div>
      )}

      {view === "info" && (
      <div>
        <SubH>Links</SubH>
        <Card>
          {LINKS.map((l, i) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-[11px] px-3.5 py-[13px] no-underline ${
                i < LINKS.length - 1 ? "border-b border-rule" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-blaze underline decoration-[#E5C9B4] underline-offset-[3px]">
                  {l.label}
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-mute mt-0.5">
                  <Favicon url={l.url} size={12} /> {l.domain}
                </div>
              </div>
              <ExternalLink size={14} className="text-mute shrink-0" />
            </a>
          ))}
        </Card>
      </div>
      )}

      {view === "info" && (
        <button
          onClick={onReplayIntro}
          className="block mx-auto mt-7 bg-transparent border-none cursor-pointer font-mono text-[11px] text-mute underline underline-offset-2"
        >
          replay the intro
        </button>
      )}

      {mapOpen && <MapOverlay onClose={() => setMapOpen(false)} />}

      {photoOf?.photo && (
        <button
          onClick={() => setPhotoOf(null)}
          aria-label="Close photo"
          className="fixed inset-0 z-50 bg-black/85 border-none cursor-zoom-out flex flex-col items-center justify-center p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- storage-hosted photo */}
          <img
            src={photoOf.photo.src}
            alt={photoOf.name}
            className="max-w-full max-h-[78vh] rounded-lg"
          />
          <div className="font-mono text-[10.5px] text-[#CFCABC] mt-3">
            {photoOf.name} · {photoOf.photo.credit}
          </div>
        </button>
      )}
    </div>
  );
}
