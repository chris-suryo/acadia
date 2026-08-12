/**
 * Receipt prep: fit inside 1400px on the long edge, keeping the aspect ratio.
 *
 * Bigger than an avatar because the point is reading it — a receipt squashed to
 * 256px is a picture of a receipt, not a receipt. Still an order of magnitude
 * smaller than what a phone camera hands over, which matters on campground
 * signal.
 */
export async function downscalePhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const MAX = 1400;
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("encode failed"))),
        "image/jpeg",
        0.8,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
