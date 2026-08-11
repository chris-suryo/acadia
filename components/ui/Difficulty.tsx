import type { TrailLevel } from "@/lib/content";

const LABEL: Record<TrailLevel, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};
const BARS: Record<TrailLevel, number> = { easy: 1, moderate: 2, hard: 3 };
const TONE: Record<TrailLevel, string> = {
  easy: "bg-moss",
  moderate: "bg-blaze",
  hard: "bg-[#9d3b1c]",
};
const HEIGHT = ["h-[4px]", "h-[7px]", "h-[10px]"];

/**
 * Trail difficulty as a three-bar meter — Chris asked for an icon rather than
 * the word. Filled bars carry the level; the label rides along for screen
 * readers and long-press tooltips, since colour alone isn't a legend.
 */
export function Difficulty({
  level,
  className = "",
}: {
  level: TrailLevel;
  className?: string;
}) {
  const filled = BARS[level];
  return (
    <span
      title={LABEL[level]}
      // `relative` is load-bearing: the sr-only label below is absolutely
      // positioned, and without a positioned ancestor its containing block is
      // the page itself — inside a horizontal carousel that means the label
      // sits at the scrolled-away card's x-offset and stretches the document
      // wide enough to pan sideways.
      className={`relative inline-flex items-end gap-[2px] shrink-0 ${className}`}
    >
      {HEIGHT.map((h, i) => (
        <span
          key={h}
          aria-hidden
          className={`w-[3px] rounded-[1px] ${h} ${i < filled ? TONE[level] : "bg-rule"}`}
        />
      ))}
      <span className="sr-only">{LABEL[level]} trail</span>
    </span>
  );
}
