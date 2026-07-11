"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Carousel.module.css";

const SLIDES = [
  "/demo/dummy-01.svg",
  "/demo/dummy-02.svg",
  "/demo/dummy-03.svg",
];

export default function Carousel({ params }: { params: ParamValues }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  const interval = Math.round(params.interval);

  // 自動送り。indexが変わるたびにタイマーを仕切り直すため、手動操作でも自然にリセットされる
  // interval=0とreduced-motion時は回さない
  useEffect(() => {
    if (interval === 0 || reduce) return;
    const id = setTimeout(
      () => setIndex((index + 1) % SLIDES.length),
      interval * 1000
    );
    return () => clearTimeout(id);
  }, [interval, reduce, index]);

  const go = (i: number) => {
    setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  };

  // トラック1本をtranslateXで動かす。reduced-motion時はアニメーションなしの即時切り替え
  const trackStyle: CSSProperties = {
    transform: `translateX(-${index * 100}%)`,
    transition: reduce
      ? "none"
      : `transform ${params.duration}s cubic-bezier(0.45, 0, 0.25, 1)`,
  };

  return (
    <DemoStage hint="矢印・ドット: スライドを切り替え">
      <div className={styles.wrap}>
        <div className={styles.viewport}>
          <div className={styles.track} style={trackStyle}>
            {SLIDES.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                draggable={false}
                className={styles.slide}
              />
            ))}
          </div>
          <button
            className={`${styles.arrow} ${styles.prev}`}
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            className={`${styles.arrow} ${styles.next}`}
            onClick={() => go(index + 1)}
            aria-label="Next slide"
          >
            ›
          </button>
        </div>
        <div className={styles.dots}>
          {SLIDES.map((src, i) => (
            <button
              key={src}
              className={
                i === index ? `${styles.dot} ${styles.dotActive}` : styles.dot
              }
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </DemoStage>
  );
}

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCE_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false
  );
}
