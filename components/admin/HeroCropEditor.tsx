"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_HERO_CROP,
  HERO_CROP_MAX_ZOOM,
  HeroCrop,
  clampHeroCrop,
  formatHeroPhoto,
  heroCropStyle,
  parseHeroPhoto,
} from "@/lib/heroCrop";

/**
 * Per-photo framing for the phone hero (UI preview hotel only). Each frame
 * has the hero's phone proportions (375×420); pinch or wheel to zoom, drag to
 * move. Results go out as `hero_photo_crops` and are merged into
 * hero_photos by resolveHeroPhotos.
 */
export function HeroCropEditor({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-(--color-ink)">スマホ表示の切り抜き</span>
      <p className="text-xs text-(--color-ink-soft)">
        枠はスマホのトップ画面と同じ比率です。ピンチ（PCではホイールかスライダー）で拡大、ドラッグで位置を合わせ、「更新する」で保存します。
      </p>
      <div className="flex flex-wrap gap-4">
        {photos.map((stored) => (
          <CropFrame key={stored} stored={stored} />
        ))}
      </div>
    </div>
  );
}

function CropFrame({ stored }: { stored: string }) {
  const { src, crop: saved } = parseHeroPhoto(stored);
  const [crop, setCrop] = useState<HeroCrop>(saved ?? DEFAULT_HERO_CROP);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ crop: HeroCrop; dist: number } | null>(null);

  // Wheel zoom needs a non-passive listener to keep the page from scrolling.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCrop((c) => clampHeroCrop({ ...c, zoom: c.zoom * Math.exp(-e.deltaY * 0.002) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = { crop, dist: pointers.current.size === 2 ? distance() : 0 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const start = gesture.current;
      setCrop((c) => clampHeroCrop({ ...c, zoom: (start.crop.zoom * distance()) / start.dist }));
      return;
    }

    // A point p shows at origin + zoom·(p − origin), so moving the origin by d
    // moves the photo by (1 − zoom)·d. Invert that to follow the finger.
    const rect = frameRef.current!.getBoundingClientRect();
    setCrop((c) => {
      if (c.zoom <= 1) return c;
      const dx = ((e.clientX - prev.x) / rect.width) * 100;
      const dy = ((e.clientY - prev.y) / rect.height) * 100;
      return clampHeroCrop({ ...c, x: c.x - dx / (c.zoom - 1), y: c.y - dy / (c.zoom - 1) });
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    gesture.current = pointers.current.size > 0 ? { crop, dist: 0 } : null;
  };

  return (
    <div className="w-[240px] space-y-2">
      <div
        ref={frameRef}
        className="relative aspect-[375/420] cursor-grab touch-none overflow-hidden rounded-xl bg-black select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={heroCropStyle(crop)}
        />
        {/* Same bottom shade as the phone hero, where the hotel name sits. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_30%,rgba(0,0,0,.75)_100%)]" />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={HERO_CROP_MAX_ZOOM}
          step={0.05}
          value={crop.zoom}
          onChange={(e) => setCrop((c) => clampHeroCrop({ ...c, zoom: Number(e.target.value) }))}
          aria-label="拡大率"
          className="flex-1 accent-(--color-coral)"
        />
        <span className="w-10 text-right text-xs tabular-nums text-(--color-ink-soft)">{crop.zoom.toFixed(1)}x</span>
        <button
          type="button"
          onClick={() => setCrop(DEFAULT_HERO_CROP)}
          className="rounded-md border border-(--color-line) px-2 py-1 text-xs"
        >
          戻す
        </button>
      </div>
      <input type="hidden" name="hero_photo_crops" value={formatHeroPhoto(src, crop)} />
    </div>
  );
}
