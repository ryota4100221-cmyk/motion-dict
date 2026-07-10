"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SectionColorSwap.module.css";

// 各セクションが持つ背景色(実務ではdata-bg属性に相当)
const SECTIONS = [
  { label: "CHAPTER 01", color: "#111114" },
  { label: "CHAPTER 02", color: "#1d2810" },
  { label: "CHAPTER 03", color: "#2a2118" },
  { label: "CHAPTER 04", color: "#0f1f22" },
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

export default function SectionColorSwap({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [bg, setBg] = useState(SECTIONS[0].color);
  const reduce = useReducedMotion();
  const trigger = params.trigger;

  // 次セクションの進入をIntersectionObserverで検知して背景1枚を書き換える。
  // thresholdは作成時に固定されるため、trigger変更時はobserverを作り直す
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const sections = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-bg]")
    );
    const io = new IntersectionObserver(
      (entries) => {
        // しきい値以上見えているセクションのうち、直近に跨いだものへ切り替える
        const hit = entries.filter((e) => e.intersectionRatio >= trigger);
        const last = hit[hit.length - 1];
        if (last) {
          setBg((last.target as HTMLElement).dataset.bg ?? SECTIONS[0].color);
        }
      },
      { root: scroller, threshold: trigger }
    );
    sections.forEach((s) => io.observe(s));

    return () => io.disconnect();
  }, [trigger]);

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div
        className={styles.scroller}
        ref={scrollerRef}
        style={{
          backgroundColor: bg,
          // reduced-motion時は補間なしの即時切替(色の切り替え自体は残す)
          transitionDuration: reduce ? "0s" : `${params.duration}s`,
        }}
      >
        <div className={styles.content}>
          {SECTIONS.map((s) => (
            <section className={styles.card} data-bg={s.color} key={s.label}>
              <span className={styles.cardLabel}>{s.label}</span>
              <span className={styles.cardHex}>{s.color}</span>
              <span className={styles.cardLine} />
            </section>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
