"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./hero-slideshow.module.css";

export type HeroSlide = {
  id: string;
  src: string;
  caption?: string;
};

const INTERVAL_MS = 5000;

/**
 * Full-bleed food slideshow for the UI preview hero. Each photo is shown
 * cropped in close and slowly zooms (Ken Burns), so even a normal dish shot
 * reads like a macro close-up. Slides cross-fade; dots let guests jump.
 * Motion stops for prefers-reduced-motion (see hero-slideshow.module.css).
 */
export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  // null until mounted: the first slide is a random dish, picked on the
  // client so server and client renders match, then faded in.
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

  if (count === 0) return null;

  return (
    <div className={styles.root}>
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`${styles.slide} ${i === index ? styles.active : ""}`}
          aria-hidden="true"
        >
          <Image
            src={slide.src}
            alt=""
            fill
            // Zoomed up to 1.6x (see .photo), so fetch enough pixels to stay sharp.
            sizes="160vw"
            quality={85}
            // First thing on screen; see HeroCollage for why not lazy.
            loading="eager"
            fetchPriority={i === index ? "high" : "auto"}
            className={styles.photo}
          />
        </div>
      ))}

      {index !== null && slides[index].caption && <p className={styles.caption}>{slides[index].caption}</p>}

      {count > 1 && (
        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <button
              type="button"
              key={slide.id}
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
