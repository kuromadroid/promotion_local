"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoCropModal } from "@/components/admin/PhotoCropModal";

type PhotoItem =
  | { kind: "existing"; key: string; url: string }
  | { kind: "new"; key: string; blob: Blob; previewUrl: string };

export function RestaurantPhotoManager({ initialPhotos }: { initialPhotos: string[] }) {
  const [items, setItems] = useState<PhotoItem[]>(
    initialPhotos.map((url) => ({ kind: "existing", key: url, url }))
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFilesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingFiles.length === 0) {
      setCropSrc(null);
      return;
    }
    const url = URL.createObjectURL(pendingFiles[0]);
    setCropSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFiles]);

  // Keep the real file input's FileList in sync with the cropped blobs, so the
  // server action (which reads formData.getAll("photo_files")) receives them.
  useEffect(() => {
    const input = newFilesInputRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    for (const item of items) {
      if (item.kind === "new") {
        dt.items.add(new File([item.blob], `${item.key}.jpg`, { type: "image/jpeg" }));
      }
    }
    input.files = dt.files;
  }, [items]);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setPendingFiles((prev) => [...prev, ...Array.from(fileList)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropConfirm = (blob: Blob) => {
    setItems((prev) => [
      ...prev,
      { kind: "new", key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`, blob, previewUrl: URL.createObjectURL(blob) },
    ]);
    setPendingFiles((prev) => prev.slice(1));
  };

  const handleCropCancel = () => {
    setPendingFiles((prev) => prev.slice(1));
  };

  const removeItem = (key: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.key === key);
      if (target?.kind === "new") URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.key !== key);
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const existingUrlsInOrder = items.filter((i) => i.kind === "existing").map((i) => i.url);
  const photoOrder = items
    .map((item) => {
      if (item.kind === "existing") return `E${existingUrlsInOrder.indexOf(item.url)}`;
      const newIndex = items.filter((i) => i.kind === "new").findIndex((i) => i.key === item.key);
      return `N${newIndex}`;
    })
    .join(",");

  return (
    <div>
      <span className="block text-sm font-medium text-(--color-ink)">写真</span>
      <p className="mt-1 text-xs text-(--color-ink-soft)">
        先頭の写真がサムネイル(一覧などの代表写真)になります。↑↓で並び替え、✕で削除。追加した写真はその場で枠に合わせて調整できます。
      </p>

      {items.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={item.key}
              className="group relative overflow-hidden rounded-lg border border-(--color-line)"
            >
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-(--color-coral) px-2 py-0.5 text-[10px] font-bold text-white">
                  サムネイル
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.kind === "existing" ? item.url : item.previewUrl}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-1.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-xs font-bold disabled:opacity-30"
                    aria-label="前へ"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-xs font-bold disabled:opacity-30"
                    aria-label="後ろへ"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="rounded bg-white/90 px-1.5 py-0.5 text-xs font-bold text-(--color-coral-deep)"
                  aria-label="削除"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input type="hidden" name="existing_photos" value={existingUrlsInOrder.join("|")} />
      <input type="hidden" name="photo_order" value={photoOrder} />
      <input ref={newFilesInputRef} type="file" name="photo_files" multiple className="hidden" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="mt-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-(--color-navy) file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-(--color-navy-deep)"
      />
      <p className="mt-1 text-xs text-(--color-ink-soft)">
        複数選択できます。選択後、4:3の枠でピンチ/ドラッグして調整してから追加されます。
      </p>

      {cropSrc && (
        <PhotoCropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />
      )}
    </div>
  );
}
