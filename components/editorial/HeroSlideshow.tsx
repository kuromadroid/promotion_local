"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./hero-slideshow.module.css";

export type HeroSlide = {
  id: string;
  src: string;
  caption?: string;
};

/**
 * Full-bleed food photo for the UI preview hero. Shows one photo, picked at
 * random on each page visit; no motion or effects.
 */
export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  // null until mounted: picked on the client so server and client renders match.
  const [index, setIndex] = useState<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIndex(Math.floor(Math.random() * count)));
    return () => cancelAnimationFrame(frame);
  }, [count]);

  if (count === 0 || index === null) return null;
  const slide = slides[index];

  return (
    <div className={styles.root} aria-hidden="true">
      <Image
        src={slide.src}
        alt=""
        fill
        sizes="100vw"
        quality={85}
        // First thing on screen; see HeroCollage for why not lazy.
        loading="eager"
        fetchPriority="high"
        className={styles.photo}
      />
      {slide.caption && <p className={styles.caption}>{slide.caption}</p>}
    </div>
  );
}
