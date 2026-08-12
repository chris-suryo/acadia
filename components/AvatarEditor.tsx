"use client";

// The photo cropper in a bottom sheet, for changing your picture from the
// header or the roster. The intro shows the same cropper inline instead.

import { BottomSheet } from "./ui/BottomSheet";
import { AvatarCrop } from "./ui/AvatarCrop";

export function AvatarEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <AvatarCrop onSaved={onClose} />
    </BottomSheet>
  );
}
