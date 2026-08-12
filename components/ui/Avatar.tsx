"use client";

import { useData } from "@/lib/data/context";

/**
 * Someone's profile picture, falling back to their initial.
 *
 * `url` overrides the lookup — roster members aren't devices, so they have no
 * `avatars` entry of their own and borrow one from whoever's signed in as them.
 */
export function Avatar({
  userId,
  name,
  size = 24,
  url: override,
}: {
  userId: string;
  name: string;
  size?: number;
  url?: string;
}) {
  const { avatars } = useData();
  const url = override ?? avatars[userId];
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
