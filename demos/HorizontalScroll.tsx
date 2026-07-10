"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./HorizontalScroll.module.css";

const PANELS = ["Work 01", "Work 02", "Work 03", "Work 04"];

export default function HorizontalScroll({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!scroller || !section || !viewport || !track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // lerpの現在値。目標値へ毎フレーム smooth 分だけ寄せる
    let current = 0;

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      const viewW = scroller.clientWidth;
      const viewH = scroller.clientHeight;
      // 縦量→横量の変換: 横に動かす距離の分だけ親セクションを高くする
      const dist = Math.round(viewW * p.distance);
      const h = viewH + dist;
      if (section.offsetHeight !== h) section.style.height = `${h}px`;
      if (viewport.offsetHeight !== viewH) viewport.style.height = `${viewH}px`;
      const trackW = viewW + dist;
      if (track.offsetWidth !== trackW) track.style.width = `${trackW}px`;

      // セクション内のスクロール進捗0〜1を translateX(0〜-dist) に写す
      const t = Math.min(
        1,
        Math.max(0, (scroller.scrollTop - section.offsetTop) / dist)
      );
      const target = -t * dist;
      // reduced-motion時は慣性(lerp)を切ってスクロールに1:1で即追従
      const k = reduce ? 1 : p.smooth;
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.05) current = target;
      track.style.transform = `translate3d(${current}px, 0, 0)`;
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage hint="ステージ内を縦にスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.content}>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Section 01</span>
            <span className={styles.cardLine} />
          </div>
          {/* 高さ=ステージ高+横移動距離。この中でstickyのビューポートを固定する */}
          <div className={styles.pinSection} ref={sectionRef}>
            <div className={styles.viewport} ref={viewportRef}>
              <div className={styles.track} ref={trackRef}>
                {PANELS.map((label) => (
                  <div className={styles.panel} key={label}>
                    <span className={styles.panelLabel}>{label}</span>
                    <span className={styles.panelLine} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Section 02</span>
            <span className={styles.cardLine} />
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
