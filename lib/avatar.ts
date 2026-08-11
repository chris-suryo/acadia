// Client-side avatar prep: cover-crop to a 256px square JPEG so uploads stay
// tiny regardless of what the camera roll hands over.

export async function downscaleAvatar(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const S = 256;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    const scale = Math.max(S / img.naturalWidth, S / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("encode failed"))),
        "image/jpeg",
        0.85,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
