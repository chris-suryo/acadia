"use client";

// Pick a shot, then pinch/drag it inside a round frame until the crop looks
// right. Save renders exactly what's framed.
//
// Lives apart from the sheet that used to own it because the intro shows the
// same cropper full-screen on pine. Nothing here depends on a container: the
// frame is sized by `size` and `save()` measures that one element.

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Btn } from "@/components/primitives";
import { PinchSurface, usePinchPan } from "./PinchPan";
import { useUi } from "./UiProvider";
import { useData } from "@/lib/data/context";

const OUT = 256;

export function AvatarCrop({
  size = 220,
  tone = "light",
  onSaved,
}: {
  /** Frame width in px. Must stay square — `save()` uses it for both axes. */
  size?: number;
  tone?: "light" | "dark";
  onSaved?: () => void;
}) {
  const { avatars, userId, setAvatar } = useData();
  const { showNotice } = useUi();
  const [src, setSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { t, surface, handlers, reset } = usePinchPan({ min: 1, max: 5 });
  const dark = tone === "dark";

  const current = src ?? avatars[userId] ?? null;

  const pick = (f: File) => {
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(f));
    reset();
  };

  const save = async () => {
    const el = imgRef.current;
    const box = surface.current;
    if (!el || !box || !current) {
      onSaved?.();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onSaved?.();
      return;
    }

    // The frame is square and the image is object-contain inside it, so the
    // drawn size at scale 1 is the contain fit; the transform then scales
    // about the frame's center and translates by (x, y).
    const S = box.clientWidth;
    const k = OUT / S;
    const fit = Math.min(S / el.naturalWidth, S / el.naturalHeight);
    const w = el.naturalWidth * fit * t.scale;
    const h = el.naturalHeight * fit * t.scale;
    const left = S / 2 + t.x - w / 2;
    const top = S / 2 + t.y - h / 2;
    // Finish no matter what: re-framing a stored photo reads it cross-origin,
    // and any canvas failure must not strand the caller open.
    try {
      ctx.fillStyle = "#F7F3E8";
      ctx.fillRect(0, 0, OUT, OUT);
      ctx.drawImage(el, left * k, top * k, w * k, h * k);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85),
      );
      if (blob) setAvatar(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      else showNotice("Couldn't save photo — retry");
    } catch (e) {
      console.error("[avatar crop]", e);
      showNotice("Couldn't save photo — retry");
    } finally {
      onSaved?.();
    }
  };

  const frame = { width: size, height: size };

  return (
    <div className="grid gap-3 justify-items-center">
      {/* No `capture`, so iOS offers the library alongside the camera. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
        }}
      />
      {current ? (
        <>
          <PinchSurface
            t={t}
            surface={surface}
            handlers={handlers}
            className={`rounded-full border ${dark ? "border-granite bg-pinelift" : "border-rule bg-[#EFEADC]"}`}
            style={frame}
          >
            <div className="w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- local crop preview */}
              <img
                ref={imgRef}
                src={current}
                alt=""
                draggable={false}
                // Stored photos come from Supabase storage; without this the
                // canvas is tainted and the crop can't be read back.
                crossOrigin="anonymous"
                className="max-w-full max-h-full w-auto h-auto select-none"
              />
            </div>
          </PinchSurface>
          <div className={`font-mono text-[10.5px] ${dark ? "text-sky" : "text-mute"}`}>
            pinch and drag to frame it
          </div>
        </>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          style={frame}
          className={`rounded-full border flex flex-col items-center justify-center gap-2 cursor-pointer ${
            dark
              ? "border-granite bg-pinelift text-sky"
              : "border-rule bg-[#EFEADC] text-granite"
          }`}
        >
          <Camera size={26} />
          <span className="font-mono text-[10.5px]">choose a photo</span>
        </button>
      )}
      {current && (
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => fileRef.current?.click()}
            className={`flex-1 bg-transparent border rounded-lg py-3 text-[13px] font-semibold cursor-pointer min-h-[46px] ${
              dark ? "border-granite text-parchment" : "border-rule text-granite"
            }`}
          >
            Choose another
          </button>
          <div className="flex-1">
            <Btn onClick={save} full>
              Save
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
