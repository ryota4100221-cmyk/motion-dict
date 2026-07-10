"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./VelocitySkew.module.css";

const ROWS = [
  "Velocity",
  "Skew",
  "Motion",
  "Speed",
  "Inertia",
  "Scroll",
  "Friction",
  "Momentum",
  "Rest",
];

export default function VelocitySkew({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const wrap = wrapRef.current;
    if (!scroller || !wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = scroller.scrollTop;
    let skew = 0;

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      const top = scroller.scrollTop;
      // スクロール速度 = 毎フレームのscrollTop差分
      const vel = top - last;
      last = top;
      // 速度×factorを目標にし、±maxSkewでクランプ。止まると目標は0
      const target = Math.max(-p.maxSkew, Math.min(p.maxSkew, vel * p.factor));
      skew += (target - skew) * p.lerp;
      // reduced-motion時はスキュー無効
      if (reduce) skew = 0;
      wrap.style.transform = `skewY(${skew}deg)`;
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage hint="ステージ内を速くスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.wrap} ref={wrapRef}>
          {ROWS.map((word, i) => (
            <div
              className={
                i === 4
                  ? `${styles.row} ${styles.rowAccent}`
                  : i % 2 === 1
                    ? `${styles.row} ${styles.rowDim}`
                    : styles.row
              }
              key={word}
            >
              {word}
            </div>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
