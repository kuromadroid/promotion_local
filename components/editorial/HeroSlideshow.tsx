"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_HERO_CROP, HeroCrop, heroCropStyle } from "@/lib/heroCrop";
import styles from "./hero-slideshow.module.css";

export type HeroSlide = {
  id: string;
  src: string;
  caption?: string;
  /** Framing set in admin; defaults to DEFAULT_PREVIEW_CROP. */
  crop?: HeroCrop;
};

const INTERVAL_MS = 4500;
const LONG_PRESS_MS = 180;
// The tall hero already enlarges a landscape photo a lot. Source photos are about
// 1200px wide, so zooming much further turns them soft and hides what the dish is.
const DEFAULT_PREVIEW_CROP: HeroCrop = { ...DEFAULT_HERO_CROP, zoom: 1.5 };

/** Full-bleed food photos for the UI preview hotel. */
export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  // null until mounted: picked on the client so server and client renders match.
  const [index, setIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(INTERVAL_MS);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const pointer = useRef<{ id: number; x: number; y: number; longPress: boolean } | null>(null);
  const suppressClick = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerStartedAt = useRef<number | null>(null);
  const loadedRef = useRef<Set<number>>(new Set());
  const count = slides.length;
  const activeLoaded = index !== null && loaded.has(index);

  useEffect(() => {
    if (count === 0) return;
    const frame = requestAnimationFrame(() => setIndex(Math.floor(Math.random() * count)));
    return () => cancelAnimationFrame(frame);
  }, [count]);

  const goTo = useCallback((target: number) => {
    const normalized = (target + count) % count;
    if (!loadedRef.current.has(normalized)) {
      setPendingIndex(normalized);
      setPaused(true);
      return;
    }
    setPendingIndex(null);
    setRemaining(INTERVAL_MS);
    setIndex(normalized);
  }, [count]);

  // Starts only once the photo is showing, so a slow load doesn't use up its time.
  useEffect(() => {
    if (index === null || count < 2 || paused || pendingIndex !== null || !activeLoaded) return;
    timerStartedAt.current = Date.now();
    const timer = setTimeout(() => goTo(index + 1), remaining);
    return () => {
      clearTimeout(timer);
      timerStartedAt.current = null;
    };
  }, [index, count, paused, pendingIndex, activeLoaded, remaining, goTo]);

  const pause = () => {
    const startedAt = timerStartedAt.current;
    if (!paused && startedAt !== null) {
      setRemaining(Math.max(0, remaining - (Date.now() - startedAt)));
    }
    setPaused(true);
  };

  const resume = () => setPaused(false);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || count < 2) return;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, longPress: false };
    holdTimer.current = setTimeout(() => {
      if (!pointer.current) return;
      pointer.current.longPress = true;
      setHolding(true);
      pause();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = pointer.current;
    if (!active || active.id !== event.pointerId) return;
    if (Math.abs(event.clientY - active.y) > 10) {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = null;
      if (active.longPress) {
        active.longPress = false;
        setHolding(false);
        resume();
      }
    }
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    const active = pointer.current;
    if (!active || active.id !== event.pointerId) return;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    pointer.current = null;
    if (active.longPress) {
      suppressClick.current = !cancelled;
      setHolding(false);
      resume();
    }
  };

  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  if (count === 0 || index === null) return null;
  const slide = slides[index];
  const nextIndex = (index + 1) % count;

  // Also called when a photo fails, so a broken one can't stop the slideshow.
  const markLoaded = (i: number) => {
    loadedRef.current.add(i);
    setLoaded(new Set(loadedRef.current));
    if (pendingIndex === i) {
      setPendingIndex(null);
      setRemaining(INTERVAL_MS);
      setIndex(i);
      setPaused(false);
    }
  };

  return (
    <div
      className={`${styles.root} ${holding ? styles.holding : ""}`}
      tabIndex={0}
      aria-label="料理写真スライド"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); goTo(index + 1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); goTo(index - 1); }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finishPointer(event)}
      onPointerCancel={(event) => finishPointer(event, true)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {slides.map((s, i) => {
        const active = i === index;
        const isNext = i === nextIndex;
        return (
          <Image
            key={s.id}
            src={s.src}
            alt=""
            fill
            sizes={`${Math.ceil((s.crop?.zoom ?? DEFAULT_PREVIEW_CROP.zoom) * 107)}vw`}
            quality={90}
            loading={active || isNext ? "eager" : "lazy"}
            fetchPriority={active ? "high" : "auto"}
            draggable={false}
            onLoad={() => markLoaded(i)}
            onError={() => markLoaded(i)}
            className={`${styles.photo} ${active ? styles.photoActive : ""}`}
            style={heroCropStyle(s.crop ?? DEFAULT_PREVIEW_CROP)}
            aria-hidden={!active}
          />
        );
      })}
      {slide.caption && <p className={styles.caption}>{slide.caption}</p>}

      {count > 1 && (
        <div className={styles.progress} aria-hidden="true">
          {slides.map((s, i) => (
            <span key={s.id} className={styles.progressTrack}>
              <span
                className={`${styles.progressFill} ${i < index ? styles.progressComplete : ""} ${i === index ? styles.progressCurrent : ""}`}
                style={i === index ? { animationPlayState: paused || !activeLoaded ? "paused" : "running" } : undefined}
              />
            </span>
          ))}
        </div>
      )}

      {count > 1 && (
        <>
          <button type="button" className={styles.previous} aria-label="前の写真" onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            goTo(index - 1);
          }} />
          <button type="button" className={styles.next} aria-label="次の写真" onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            goTo(index + 1);
          }} />
        </>
      )}
    </div>
  );
}
