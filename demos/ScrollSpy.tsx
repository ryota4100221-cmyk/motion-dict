"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ScrollSpy.module.css";

const SECTIONS = ["Intro", "About", "Works", "Flow", "Contact"];

// CSSの .navItem の高さと合わせる(インジケーターの移動量)
const ITEM_H = 26;

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

export default function ScrollSpy({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const line = Math.round(params.line);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const sections = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-index]")
    );
    // 「見えたら」ではなくrootMarginで上下を削り込み、rootの上から line% の
    // 位置に細い判定帯を作る。帯に触れたセクションだけをアクティブにすることで
    // 境界で2つ同時に光る事故を防ぐ(アクティブは常に1つ)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting)
            setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { root: scroller, rootMargin: `-${line}% 0px -${99 - line}% 0px` }
    );
    sections.forEach((s) => io.observe(s));

    return () => io.disconnect();
  }, [line]);

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.content}>
          {SECTIONS.map((label, i) => (
            <div className={styles.section} data-index={i} key={label}>
              <span className={styles.sectionLabel}>{label}</span>
              <span className={styles.sectionLine} />
            </div>
          ))}
        </div>
      </div>
      {/* 判定ライン(ここに触れたセクションが現在地になる) */}
      <span
        className={styles.judgeLine}
        style={{ top: `${line}%` }}
        aria-hidden
      />
      <nav className={styles.nav} aria-hidden>
        <span
          className={styles.indicator}
          style={{
            transform: `translateY(${active * ITEM_H}px)`,
            // reduced-motion時はスライドさせず即時反映
            transitionDuration: reduce ? "0s" : `${params.duration}s`,
          }}
        />
        {SECTIONS.map((label, i) => (
          <span
            className={
              i === active
                ? `${styles.navItem} ${styles.navItemActive}`
                : styles.navItem
            }
            key={label}
          >
            {label}
          </span>
        ))}
      </nav>
    </DemoStage>
  );
}
