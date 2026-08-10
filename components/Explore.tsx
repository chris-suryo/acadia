"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, Map as MapIcon } from "lucide-react";
import { Card, SubH } from "./primitives";
import { EATS, EATS_DIRECTORY, GUIDES, LINKS, MAP_PDF_URL, SPOTS, type Spot } from "@/lib/content";
import { MapLightbox, HAS_CAMPGROUND_MAP } from "./MapLightbox";

export function Explore({
  highlight,
  clearHighlight,
}: {
  highlight: string | null;
  clearHighlight: () => void;
}) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (highlight && refs.current[highlight]) {
      refs.current[highlight]?.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(clearHighlight, 2500);
      return () => clearTimeout(t);
    }
  }, [highlight, clearHighlight]);

  const Row = ({ p, last }: { p: Spot; last: boolean }) => (
    <div
      ref={(el) => {
        refs.current[p.id] = el;
      }}
      className={`px-3.5 py-[13px] transition-[background] duration-500 ${
        last ? "" : "border-b border-rule"
      } ${highlight === p.id ? "bg-[#FBEFE4]" : "bg-transparent"}`}
    >
      <div className="flex justify-between items-baseline gap-2.5">
        <span className="text-[14.5px] font-semibold text-ink">{p.name}</span>
        {p.links.length > 0 && (
          <span className="inline-flex items-center gap-3 shrink-0">
            {p.links.map((l) => (
              <a
                key={l.url + l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-blaze no-underline"
              >
                {l.label} <ExternalLink size={11} />
              </a>
            ))}
          </span>
        )}
      </div>
      <div className="font-mono text-[10.5px] text-blaze mt-[3px] mb-[5px]">{p.meta}</div>
      <div className="text-[12.5px] text-granite leading-[1.55]">{p.note}</div>
    </div>
  );

  const park = SPOTS.filter((s) => s.zone === "park");
  const town = SPOTS.filter((s) => s.zone === "town");

  return (
    <div className="px-3.5 pt-4 pb-[60px]">
      <div className="mb-[22px]">
        <SubH>Campground</SubH>
        {HAS_CAMPGROUND_MAP ? (
          <MapLightbox />
        ) : (
          <a
            href={MAP_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            <Card className="p-[13px] flex gap-[11px] items-center">
              <MapIcon size={19} className="text-blaze shrink-0" />
              <div className="flex-1">
                <div className="text-[14.5px] font-semibold text-ink">
                  Blackwoods map — loops & site numbers
                </div>
                <div className="font-mono text-[10.5px] text-mute mt-0.5">
                  recreation.gov
                </div>
              </div>
              <ExternalLink size={14} className="text-mute" />
            </Card>
          </a>
        )}
      </div>

      <div className="mb-[22px]">
        <SubH>In the park</SubH>
        <Card>
          {park.map((p, i) => (
            <Row key={p.id} p={p} last={i === park.length - 1} />
          ))}
        </Card>
      </div>

      <div className="mb-[22px]">
        <SubH>Bar Harbor & nearby</SubH>
        <Card>
          {town.map((p, i) => (
            <Row key={p.id} p={p} last={i === town.length - 1} />
          ))}
        </Card>
      </div>

      <div className="mb-[22px]">
        <SubH right="call ahead — none reserve for 12">Eat with a group</SubH>
        <Card>
          {EATS.map((e) => (
            <div
              key={e.name}
              className="px-3.5 py-[11px] border-b border-rule"
            >
              <span className="text-[14px] font-medium text-ink">{e.name}</span>
              {e.meta && (
                <div className="font-mono text-[10.5px] text-mute mt-0.5">
                  {e.meta}
                </div>
              )}
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
              <div className="font-mono text-[10.5px] text-mute mt-0.5">
                {EATS_DIRECTORY.domain}
              </div>
            </div>
            <ExternalLink size={14} className="text-mute shrink-0" />
          </a>
        </Card>
      </div>

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
              <div className="font-mono text-[10.5px] text-mute mt-0.5">
                {g.domain}
              </div>
            </a>
          ))}
        </Card>
      </div>

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
                <div className="font-mono text-[10.5px] text-mute mt-0.5">
                  {l.domain}
                </div>
              </div>
              <ExternalLink size={14} className="text-mute shrink-0" />
            </a>
          ))}
        </Card>
      </div>
    </div>
  );
}
