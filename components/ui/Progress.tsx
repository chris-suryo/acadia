/** The "how far along are we" bar above a packing list. */
export function Progress({
  done,
  total,
  label,
  right,
}: {
  done: number;
  total: number;
  label: string;
  right?: React.ReactNode;
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mb-[18px]">
      <div className="h-[7px] bg-[#E6E0CE] rounded overflow-hidden">
        <div
          className="h-full bg-moss transition-[width] duration-[250ms]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[11px] text-granite">
          {done} of {total} {label}
        </span>
        {right ? (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-mute">
            {right}
          </span>
        ) : null}
      </div>
    </div>
  );
}
