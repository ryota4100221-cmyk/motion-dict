"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./StickyPin.module.css";

export default function StickyPin({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const section = sectionRef.current;
    const panel = panelRef.current;
    const bar = barRef.current;
    if (!scroller || !section || !panel || !bar) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      const viewH = scroller.clientHeight;
      // 固定区間の長さ = 親セクションの高さ。ステージ高の length 倍を確保する
      const h = Math.round(viewH * p.length);
      if (section.offsetHeight !== h) section.style.height = `${h}px`;
      // reduced-motion時は進捗演出を止める(stickyの固定自体は動きではないので残す)
      if (reduce) {
        bar.style.transform = "scaleX(1)";
        return;
      }
      // 固定中の進捗: セクション内で消化したスクロール量を0〜1に正規化
      const pinDistance = h - panel.offsetHeight;
      const start = section.offsetTop - p.top;
      const t = Math.min(
        1,
        Math.max(0, (scroller.scrollTop - start) / pinDistance)
      );
      bar.style.transform = `scaleX(${t})`;
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.content}>
          <div className={styles.card}>
            <span className={styles.cardLabel}>SECTION 01</span>
            <span className={styles.cardLine} />
          </div>
          {/* 高さのある親セクション。stickyが効くのはこの範囲内だけ=固定区間 */}
          <div className={styles.pinSection} ref={sectionRef}>
            <div
              className={styles.panel}
              ref={panelRef}
              style={{ top: params.top }}
            >
              <span className={styles.panelLabel}>PINNED</span>
              <div className={styles.track}>
                <div className={styles.bar} ref={barRef} />
              </div>
              <span className={styles.panelNote}>固定区間の消化率</span>
            </div>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>SECTION 02</span>
            <span className={styles.cardLine} />
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
