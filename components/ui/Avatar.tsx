"use client";

import { useData } from "@/lib/data/context";

/** Someone's profile picture, falling back to their initial. */
export function Avatar({
  userId,
  name,
  size = 24,
}: {
  userId: string;
  name: string;
  size?: number;
}) {
  const { avatars } = useData();
  const url = avatars[userId];
  return (
    <span
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden border border-rule bg-[#E9EEE4] flex items-center justify-center shrink-0"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- user avatar
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span
          style={{ fontSize: Math.round(size * 0.46) }}
          className="font-display font-bold text-moss"
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
