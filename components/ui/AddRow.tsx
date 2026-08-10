"use client";

// Ghost add row: tap → inline field in place; Enter commits and stays open
// for rapid entry; tapping away commits any text and closes.

import { useRef, useState } from "react";
import { Plus } from "lucide-react";

export function AddRow({
  onAdd,
  placeholder = "",
  label = "Add",
}: {
  onAdd: (text: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commit = (keepOpen: boolean) => {
    const t = txt.trim();
    if (t) onAdd(t);
    setTxt("");
    if (keepOpen) inputRef.current?.focus();
    else setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 w-full text-left bg-transparent border-none cursor-pointer text-granite text-[13px] px-3.5 py-[11px] min-h-[44px]"
      >
        <Plus size={14} /> {label}
      </button>
    );
  }

  return (
    <div className="px-3.5 py-2">
      <input
        ref={inputRef}
        autoFocus
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(true);
          if (e.key === "Escape") {
            setTxt("");
            setOpen(false);
          }
        }}
        onBlur={() => commit(false)}
        onFocus={(e) =>
          setTimeout(
            () => e.target.scrollIntoView({ block: "center", behavior: "smooth" }),
            150,
          )
        }
        placeholder={placeholder}
        enterKeyHint="done"
        className="w-full p-2.5 rounded-lg border border-rule bg-white text-[16px] text-ink min-h-[42px]"
      />
    </div>
  );
}
