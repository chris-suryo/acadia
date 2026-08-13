"use client";

import { useState } from "react";
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
  // A photo that won't load falls back to the initial. Without this, iOS
  // renders its broken-image "?" — which is what a just-uploaded photo looks
  // like while the storage CDN is still catching up, and what everyone's
  // photo looks like the first time it's seen with no signal at camp. Keyed
  // by URL, not a boolean, so a re-upload gets a fresh chance to load.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImg = url && failedUrl !== url;
  return (
    <span
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden border border-rule bg-[#E9EEE4] flex items-center justify-center shrink-0"
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- user avatar
        <img
          src={url}
          alt=""
          // Faces are the first thing on every screen and they're tiny, so
          // they're worth the network's attention; decoding off the main
          // thread keeps a feed of them from janking as it mounts.
          fetchPriority="high"
          decoding="async"
          onError={() => setFailedUrl(url)}
          className="w-full h-full object-cover"
        />
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
