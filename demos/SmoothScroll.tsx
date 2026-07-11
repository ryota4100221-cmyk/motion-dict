"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./SmoothScroll.module.css";

const ITEMS = ["01", "02", "03", "04", "05", "06", "07", "08"];

export default function SmoothScroll({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const nativeRef = useRef<HTMLDivElement>(null);
  const smoothRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const nativeCol = nativeRef.current;
    const smoothCol = smoothRef.current;
    if (!scroller || !nativeCol || !smoothCol) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let current = scroller.scrollTop; // 慣性側の現在位置
    let last = performance.now();

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      const dt = Math.min((time - last) / 1000, 0.1);
      last = time;

      const max = scroller.scrollHeight - scroller.clientHeight;
      const target = Math.min(max, scroller.scrollTop * p.multiplier);

      // reduced-motion時は慣性を無効化し、素のスクロールと同じ即時追従にする
      // lerpはフレームレート依存なのでデルタタイムで補正(120Hzで倍速になる事故を防ぐ)
      const k = reduce ? 1 : 1 - Math.pow(1 - p.lerp, dt * 60);
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.05) current = target;

      // 実スクロールはスペーサーに任せ、見た目の列はtransformで動かす(リフロー禁止)
      nativeCol.style.transform = `translate3d(0, ${-scroller.scrollTop}px, 0)`;
      smoothCol.style.transform = `translate3d(0, ${-current}px, 0)`;
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage
      hint="ステージ内をスクロール(左: 素 / 右: 慣性)"
      className={styles.scrollStage}
    >
      <div className={styles.visual} aria-hidden>
        <div className={styles.col}>
          <span className={styles.colHead}>Native</span>
          <div className={styles.colInner} ref={nativeRef}>
            {ITEMS.map((label) => (
              <div className={styles.card} key={label}>
                <span className={styles.cardLabel}>{label}</span>
                <span className={styles.cardLine} />
              </div>
            ))}
          </div>
        </div>
        <div className={`${styles.col} ${styles.colSmooth}`}>
          <span className={styles.colHead}>Lerp</span>
          <div className={styles.colInner} ref={smoothRef}>
            {ITEMS.map((label) => (
              <div className={styles.card} key={label}>
                <span className={styles.cardLabel}>{label}</span>
                <span className={styles.cardLine} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 実スクロールを受けるレイヤー。高さだけのスペーサーで可動域を作る */}
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.spacer} />
      </div>
    </DemoStage>
  );
}
