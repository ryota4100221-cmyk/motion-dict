"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./ScrollZoom.module.css";

const DIRECTIONS = ["in", "out"] as const;

export default function ScrollZoom({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!scroller || !frame || !image) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // reduced-motion時は拡縮を止めて倍率1で固定
    if (reduce) {
      image.style.transform = "scale(1)";
      return;
    }

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      const viewH = scroller.clientHeight;
      // フレームが下端に入ってから上端へ抜けるまでを進捗0→1に正規化
      const top = frame.offsetTop - scroller.scrollTop;
      const total = viewH + frame.offsetHeight;
      const t = Math.min(1, Math.max(0, (viewH - top) / total));
      // in: 1→zoom / out: zoom→1 の線形補間
      const scale =
        DIRECTIONS[p.direction] === "out"
          ? p.zoom - (p.zoom - 1) * t
          : 1 + (p.zoom - 1) * t;
      image.style.transform = `scale(${scale})`;
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.content}>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Hero section</span>
            <span className={styles.cardLine} />
          </div>
          {/* overflow: clip のフレーム。拡縮は内側の面にかけ、はみ出しはここで断つ */}
          <div className={styles.frame} ref={frameRef}>
            <div className={styles.image} ref={imageRef} aria-hidden />
            <span className={styles.frameLabel}>Image 01</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Next section</span>
            <span className={styles.cardLine} />
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
