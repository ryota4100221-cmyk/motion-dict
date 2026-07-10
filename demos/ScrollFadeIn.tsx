"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ScrollFadeIn.module.css";

const CARDS = [
  "Section 01",
  "Section 02",
  "Section 03",
  "Section 04",
  "Section 05",
  "Section 06",
];

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

export default function ScrollFadeIn({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  // index -> stagger遅延(ms)。一度出たら出っぱなし
  const [revealed, setRevealed] = useState<Record<number, number>>({});
  const reduce = useReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-index]")
    );
    // rootをステージ内スクロールコンテナにして進入を検知
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting);
        if (hit.length === 0) return;
        for (const e of hit) io.unobserve(e.target);
        const stagger = paramsRef.current.stagger;
        setRevealed((prev) => {
          const next = { ...prev };
          // 同じフレームで進入した要素にはstagger分ずつ遅延を割り当てる
          hit.forEach((e, i) => {
            const idx = Number((e.target as HTMLElement).dataset.index);
            if (!(idx in next)) next[idx] = i * stagger;
          });
          return next;
        });
      },
      { root: scroller, threshold: 0.15 }
    );
    cards.forEach((c) => io.observe(c));

    return () => io.disconnect();
  }, []);

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.content}>
          {CARDS.map((label, i) => {
            const delay = revealed[i];
            const shown = reduce || delay !== undefined;
            // reduced-motion時はアニメーションなしで即表示
            const style: CSSProperties = shown
              ? {
                  opacity: 1,
                  transform: "translateY(0)",
                  transitionDuration: reduce ? "0s" : `${params.duration}s`,
                  transitionDelay: reduce ? "0s" : `${delay ?? 0}ms`,
                }
              : {
                  opacity: 0,
                  transform: `translateY(${params.distance}px)`,
                };
            return (
              <div
                className={styles.card}
                style={style}
                data-index={i}
                key={label}
              >
                <span className={styles.cardLabel}>{label}</span>
                <span className={styles.cardLine} />
              </div>
            );
          })}
        </div>
      </div>
    </DemoStage>
  );
}
