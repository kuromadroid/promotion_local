"use client";

import { useState } from "react";

export function PhotoGallery({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  if (photos.length === 0) return null;

  return (
    <div>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-(--color-snow-muted) sm:aspect-[16/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[active]}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity ${
                i === active
                  ? "border-(--color-coral)"
                  : "border-transparent opacity-70"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
