"use client";

const CHIP_CLS = (on: boolean) =>
  `px-3 py-1.5 min-h-[36px] rounded-full border cursor-pointer font-mono text-[10.5px] uppercase tracking-[.07em] ${
    on
      ? "border-blaze text-blaze bg-[#FBEFE4]"
      : "border-rule text-granite bg-transparent"
  }`;

/** Pick-any variant of Chips — same pills, independent toggles. */
export function MultiChips({
  options,
  values,
  onToggle,
}: {
  options: readonly string[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onToggle(o)}
          aria-pressed={values.includes(o)}
          className={CHIP_CLS(values.includes(o))}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string | null>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={CHIP_CLS(o.value === value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
