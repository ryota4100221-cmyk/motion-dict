"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./TextHighlight.module.css";

const LINES = [
  "Motion is a language.",
  "Scroll sets the pace,",
  "Words get painted",
  "As the reader arrives.",
  "Nothing moves without reason.",
];

export default function TextHighlight({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const fills = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-fill]")
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // reduced-motion時はアニメーションなしで全文を塗り済みにする
    if (reduce) {
      for (const fill of fills) fill.style.clipPath = "inset(0 0% 0 0)";
      return;
    }

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      const viewH = scroller.clientHeight;
      const scrollTop = scroller.scrollTop;
      // 塗り始めのライン = ビューポート下端から offset% 上
      const startLine = viewH * (1 - p.offset / 100);
      // ビューポート高さの span% ぶんスクロールで1行を塗り切る
      const span = viewH * (p.span / 100);
      fills.forEach((fill, i) => {
        const line = fill.parentElement;
        if (!line) return;
        // 行のビューポート内位置(offsetTopはscroller基準なのでscroll分を引く)
        const inView = line.offsetTop - scrollTop;
        // 後の行ほど stagger% ずつ進捗を遅らせ、読みの順序と塗りの順序を揃える
        const raw = (startLine - inView) / span - (i * p.stagger) / 100;
        const t = Math.min(1, Math.max(0, raw));
        fill.style.clipPath = `inset(0 ${(1 - t) * 100}% 0 0)`;
      });
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.content}>
          <div className={styles.kicker}>Manifesto</div>
          {LINES.map((text, i) => (
            <div className={styles.line} data-line key={text}>
              <span className={styles.base}>{text}</span>
              {/* 同じテキストを重ね、上層をclip-pathで左から開く */}
              <span
                className={
                  i === 2 ? `${styles.fill} ${styles.fillAccent}` : styles.fill
                }
                data-fill
                aria-hidden
              >
                {text}
              </span>
            </div>
          ))}
          <div className={styles.tail}>Keep scrolling, keep reading</div>
        </div>
      </div>
    </DemoStage>
  );
}
