"use client";

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
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 min-h-[36px] rounded-full border cursor-pointer font-mono text-[10.5px] uppercase tracking-[.07em] ${
              on
                ? "border-blaze text-blaze bg-[#FBEFE4]"
                : "border-rule text-granite bg-transparent"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
