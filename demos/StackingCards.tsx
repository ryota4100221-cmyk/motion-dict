"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./StackingCards.module.css";

const CARDS = ["Card 01", "Card 02", "Card 03", "Card 04"];

// CSSと合わせるレイアウト定数(.content padding-top / .card height / カード間margin)
const PAD_TOP = 24;
const CARD_H = 190;
const GAP = 140;
const STEP = CARD_H + GAP; // カード1枚分のスクロール量

export default function StackingCards({ params }: { params: ParamValues }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-card]")
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const removeTick = addTick(() => {
      const p = paramsRef.current;
      const scrollTop = scroller.scrollTop;

      cards.forEach((card, i) => {
        // 後のカードほどtopを下げ、前のカードの頭(peek)を覗かせる
        const stickyTop = p.top + i * p.peek;
        const topPx = `${stickyTop}px`;
        if (card.style.top !== topPx) card.style.top = topPx;

        // reduced-motion時は縮小を止める(stickyの積層自体は残す)
        if (reduce) {
          card.style.transform = "scale(1)";
          return;
        }
        // 覆われた深さ: カードiがピン留めされてからのスクロール量を
        // 「後続カード何枚分か」(0〜残り枚数)に正規化する
        const flowTop = PAD_TOP + i * STEP; // 流れの中での位置(CSS定数から算出)
        const depth = Math.min(
          CARDS.length - 1 - i,
          Math.max(0, (scrollTop - (flowTop - stickyTop)) / STEP)
        );
        card.style.transform = `scale(${1 - depth * p.scale})`;
      });
    });

    return () => removeTick();
  }, []);

  return (
    <DemoStage hint="ステージ内をスクロール" className={styles.scrollStage}>
      <div className={styles.scroller} ref={scrollerRef}>
        {/* 全カードを同じ親の直下に置く。1枚ずつ包むとstickyがすぐ剥がれて積み上がらない */}
        <div className={styles.content}>
          {CARDS.map((label) => (
            <div className={styles.card} data-card key={label}>
              <span className={styles.cardLabel}>{label}</span>
              <span className={styles.cardLine} />
            </div>
          ))}
          <div className={styles.tail}>
            <span className={styles.tailLabel}>End</span>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
