"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./ScrollMarquee.module.css";

// 1セット分のテキスト。同じものを2セット並べてシームレスにループさせる。
// 区切りをnbsp(\u00A0)にして末尾の空白が潰れないようにする(継ぎ目対策)
const GROUP = "Scroll-driven marquee\u00A0\u2014\u00A0".repeat(3);

export default function ScrollMarquee({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowARef = useRef<HTMLDivElement>(null);
  const rowBRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const rowA = rowARef.current;
    const rowB = rowBRef.current;
    if (!scroller || !rowA || !rowB) return;

    // reduced-motion時は自動の流れもスクロール加算も止め、静止表示にする
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let last = scroller.scrollTop;
    let prevTime: number | null = null;
    let boost = 0; // スクロール由来の加算速度(px/frame)
    let offset = 0;

    const removeTick = addTick((time) => {
      const p = paramsRef.current;
      const dt = prevTime === null ? 16.7 : Math.min(64, time - prevTime);
      prevTime = time;

      // スクロール速度(毎フレームのscrollTop差分)× factor を目標にlerpで追従。
      // 上スクロールでは負になり、マーキーが逆流する
      const top = scroller.scrollTop;
      const vel = top - last;
      last = top;
      boost += (vel * p.factor - boost) * p.lerp;

      // 基本速度(px/s)に加算分を乗せて進める
      offset += (p.speed * dt) / 1000 + boost;

      const w = (rowA.firstElementChild as HTMLElement).offsetWidth;
      if (w <= 0) return;
      // 1セット分の幅でループ。負のoffsetも正の余りに正規化する
      const xA = -(((offset % w) + w) % w);
      const xB = -(((-offset % w) + w) % w);
      rowA.style.transform = `translateX(${xA}px)`;
      rowB.style.transform = `translateX(${xB}px)`;
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage hint="ステージ内をスクロール(逆方向も)" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.inner}>
          <div className={styles.sticky}>
            <div className={styles.row} ref={rowARef}>
              <span className={styles.group}>{GROUP}</span>
              <span className={styles.group}>{GROUP}</span>
            </div>
            <div className={`${styles.row} ${styles.rowDim}`} ref={rowBRef}>
              <span className={styles.group}>{GROUP}</span>
              <span className={styles.group}>{GROUP}</span>
            </div>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
