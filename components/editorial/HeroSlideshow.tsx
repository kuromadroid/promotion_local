"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { DEFAULT_HERO_CROP, HeroCrop, heroCropStyle } from "@/lib/heroCrop";
import styles from "./hero-slideshow.module.css";

export type HeroSlide = {
  id: string;
  src: string;
  caption?: string;
  /** Framing set in admin; defaults to a 2x center crop. */
  crop?: HeroCrop;
};

const INTERVAL_MS = 5000;

/**
 * Full-bleed food photo for the UI preview hero. Starts on a random photo
 * each visit and switches to the next every 5s, with no transition; bars
 * along the top show which photo is up and let guests jump. Photos are
 * cropped in tight (lib/heroCrop.ts) so ingredients fill the frame.
 */
export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  // null until mounted: picked on the client so server and client renders match.
  const [index, setIndex] = useState<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIndex(Math.floor(Math.random() * count)));
    return () => cancelAnimationFrame(frame);
  }, [count]);

  useEffect(() => {
    if (index === null || count < 2) return;
    const timer = setTimeout(() => setIndex((index + 1) % count), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [index, count]);

  if (count === 0 || index === null) return null;
  const slide = slides[index];

  return (
    <div className={styles.root}>
      {/* Every photo stays mounted (hidden) so the next one is already loaded. */}
      {slides.map((s, i) => (
        <Image
          key={s.id}
          src={s.src}
          alt=""
          fill
          // Zoomed in (default 2x), so fetch extra pixels to stay sharp.
          sizes="200vw"
          quality={85}
          // First thing on screen; see HeroCollage for why not lazy.
          loading="eager"
          fetchPriority={i === index ? "high" : "auto"}
          className={styles.photo}
          style={heroCropStyle(s.crop ?? DEFAULT_HERO_CROP)}
          hidden={i !== index}
        />
      ))}
      {slide.caption && <p className={styles.caption}>{slide.caption}</p>}

      {count > 1 && (
        <div className={styles.dots}>
          {slides.map((s, i) => (
            <button
              type="button"
              key={s.id}
              aria-label={`${i + 1} / ${count}`}
              aria-current={i === index}
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
