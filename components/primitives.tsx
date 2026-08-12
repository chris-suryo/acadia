"use client";

import { Check, Trash2 } from "lucide-react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card border border-rule rounded-[10px] ${className}`}>
      {children}
    </div>
  );
}

export function SubH({
  children,
  right,
  icon: Icon,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  /** Section mark — a packing list of plain headings reads as a wall of text. */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex justify-between items-baseline mb-2 pb-[5px] border-b border-rule">
      <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[.1em] uppercase text-granite">
        {Icon ? (
          <Icon size={13} className="text-moss shrink-0 -mb-px" />
        ) : null}
        {children}
      </span>
      {right ? (
        <span className="font-mono text-[10.5px] text-blaze">{right}</span>
      ) : null}
    </div>
  );
}

const BTN_TONES: Record<string, string> = {
  blaze: "bg-blaze",
  moss: "bg-moss",
  granite: "bg-granite",
};

export function Btn({
  children,
  onClick,
  tone = "blaze",
  small = false,
  full = false,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "blaze" | "moss" | "granite";
  small?: boolean;
  full?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border-none text-white font-semibold cursor-pointer ${BTN_TONES[tone]} ${
        small
          ? "px-3 py-2 text-[12.5px] min-h-[36px]"
          : "px-4 py-3 text-[14px] min-h-[46px]"
      } ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function Input(props: React.ComponentProps<"input">) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`p-3 rounded-lg border border-rule bg-white text-[16px] text-ink w-full min-h-[46px] ${className}`}
    />
  );
}

export function Textarea(props: React.ComponentProps<"textarea">) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`p-3 rounded-lg border border-rule bg-white text-[16px] text-ink w-full resize-none leading-[1.45] ${className}`}
    />
  );
}

export function Select(props: React.ComponentProps<"select">) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`p-3 rounded-lg border border-rule bg-white text-[16px] text-ink min-h-[46px] ${className}`}
    >
      {children}
    </select>
  );
}

const BOX_CLS = (on: boolean) =>
  `shrink-0 rounded-md border-[1.5px] flex items-center justify-center ${
    on ? "border-moss bg-moss" : "border-[#B7BEAE] bg-transparent"
  }`;

// With onClick: an interactive checkbox. Without: a state indicator inside a
// row that is itself the tap target.
export function Box({
  on,
  onClick,
  size = 26,
  label,
}: {
  on: boolean;
  onClick?: () => void;
  size?: number;
  /** What this box is for. Only needed when the box is the tap target — when
   *  the row is, the row carries the name and the state. */
  label?: string;
}) {
  const box = { width: size, height: size };
  const check = size >= 24 ? 16 : 14;
  if (!onClick) {
    return (
      <span aria-hidden style={box} className={BOX_CLS(on)}>
        {on && <Check size={check} color="#fff" />}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      // A checkbox, not a toggle button: aria-pressed reads as "on/off" where
      // this means "packed / not packed".
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      style={box}
      className={`${BOX_CLS(on)} cursor-pointer`}
    >
      {on && <Check size={check} color="#fff" />}
    </button>
  );
}

export function Kill({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Delete"
      className="bg-transparent border-none cursor-pointer p-1.5 text-faint flex items-center shrink-0"
    >
      <Trash2 size={15} />
    </button>
  );
}

export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="flex bg-[#EAE4D2] rounded-[9px] p-[3px] mb-[18px]">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 px-1.5 py-[9px] rounded-[7px] border-none text-[13px] cursor-pointer min-h-[38px] ${
            value === o.id
              ? "bg-card shadow-[0_1px_2px_rgba(0,0,0,.07)] text-ink font-semibold"
              : "bg-transparent text-granite font-medium"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
