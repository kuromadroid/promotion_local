"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { cropImageToBlob } from "@/lib/cropImage";

export function PhotoCropModal({
  imageSrc,
  aspect = 4 / 3,
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  aspect?: number;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4">
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="mx-auto mt-4 w-full max-w-md space-y-4">
        <label className="flex items-center gap-3 text-sm text-white">
          ズーム
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="rounded-lg bg-(--color-coral) px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "処理中…" : "この位置で決定"}
          </button>
        </div>
      </div>
    </div>
  );
}
