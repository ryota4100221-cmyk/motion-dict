"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./ScrollProgress.module.css";

// ダミー本文の行幅(%)。0は段落の区切り
const LINES = [
  96, 88, 100, 72, 0, 94, 100, 90, 84, 100, 58, 0, 92, 100, 86, 96, 70, 0, 100,
  90, 96, 82, 100, 64, 0, 94, 88, 100, 76,
];

export default function ScrollProgress({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const bar = barRef.current;
    const pct = pctRef.current;
    if (!scroller || !bar || !pct) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      const max = scroller.scrollHeight - scroller.clientHeight;
      const target = max > 0 ? scroller.scrollTop / max : 0;
      // reduced-motion時とsmoothing=1はlerpなしで即時反映
      const k = reduce || p.smoothing >= 1 ? 1 : p.smoothing;
      current += (target - current) * k;
      bar.style.transform = `scaleX(${current})`;
      pct.textContent = `${Math.round(current * 100)}%`;
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div
        className={styles.bar}
        ref={barRef}
        style={{ height: `${params.height}px` }}
        aria-hidden
      />
      <span className={styles.pct} ref={pctRef} aria-hidden>
        0%
      </span>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.content}>
          <h3 className={styles.heading}>On motion</h3>
          {LINES.map((w, i) =>
            w === 0 ? (
              <div className={styles.break} key={i} />
            ) : (
              <div
                className={styles.line}
                style={{ width: `${w}%` }}
                key={i}
              />
            )
          )}
        </div>
      </div>
    </DemoStage>
  );
}
