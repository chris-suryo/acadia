"use client";

// Profile photo editor: pick a shot, then pinch/drag it inside a round frame
// until the crop looks right. Save renders exactly what's framed.

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { BottomSheet } from "./ui/BottomSheet";
import { Btn } from "./primitives";
import { PinchSurface, usePinchPan } from "./ui/PinchPan";
import { useData } from "@/lib/data/context";

const OUT = 256;

export function AvatarEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { avatars, userId, setAvatar } = useData();
  const [src, setSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { t, surface, handlers, reset } = usePinchPan({ min: 1, max: 5 });

  const current = src ?? avatars[userId] ?? null;

  const pick = (f: File) => {
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(f));
    reset();
  };

  const save = async () => {
    const el = imgRef.current;
    const box = surface.current;
    if (!el || !box || !current) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
    ctx.fillStyle = "#F7F3E8";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(el, left * k, top * k, w * k, h * k);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (blob) setAvatar(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="grid gap-3 justify-items-center">
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
              className="w-[220px] h-[220px] rounded-full border border-rule bg-[#EFEADC]"
            >
              <div className="w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- local crop preview */}
                <img
                  ref={imgRef}
                  src={current}
                  alt=""
                  draggable={false}
                  className="max-w-full max-h-full w-auto h-auto select-none"
                />
              </div>
            </PinchSurface>
            <div className="font-mono text-[10.5px] text-mute">
              pinch and drag to frame it
            </div>
          </>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-[220px] h-[220px] rounded-full border border-rule bg-[#EFEADC] flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <Camera size={26} className="text-granite" />
            <span className="font-mono text-[10.5px] text-granite">choose a photo</span>
          </button>
        )}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 bg-transparent border border-rule rounded-lg py-3 text-[13px] font-semibold text-granite cursor-pointer min-h-[46px]"
          >
            {current ? "Choose another" : "Choose photo"}
          </button>
          {current && (
            <div className="flex-1">
              <Btn onClick={save} full>
                Save
              </Btn>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
