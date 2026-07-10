"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./Parallax.module.css";

const BG_WORDS = ["Para", "Llax", "Depth", "Layer", "Speed", "Field"];
const FG_CARDS = ["Foreground 01", "Foreground 02", "Foreground 03"];

export default function Parallax({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const bg = bgRef.current;
    if (!scroller || !bg) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      // 背景を前景(scrollTop)のstrength倍だけ逆方向へ = 遅く動く奥のレイヤー
      const target = -scroller.scrollTop * p.strength;
      current += (target - current) * p.lerp;
      // reduced-motion時は視差を無効化してレイヤーを固定
      if (reduce) current = 0;
      bg.style.transform = `translate3d(0, ${current}px, 0)`;
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div className={styles.bg} ref={bgRef} aria-hidden>
        {BG_WORDS.map((word, i) => (
          <span
            className={i === 2 ? `${styles.bgWord} ${styles.bgWordAccent}` : styles.bgWord}
            key={word}
          >
            {word}
          </span>
        ))}
      </div>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.content}>
          {FG_CARDS.map((label) => (
            <div className={styles.card} key={label}>
              <span className={styles.cardLabel}>{label}</span>
              <span className={styles.cardLine} />
            </div>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}
