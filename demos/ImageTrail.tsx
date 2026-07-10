"use client";

import { useEffect, useRef } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ImageTrail.module.css";

const MAX_CARDS = 10; // 同時表示の上限。超えたら古いものから消す
const VARIANTS = 4; // 疑似画像(CSSグラデ)のバリエーション数

export default function ImageTrail({ params }: { params: ParamValues }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let last: { x: number; y: number } | null = null;
    let variant = 0;
    const cards: HTMLDivElement[] = [];
    const timers = new Set<number>();
    let staticCard: HTMLDivElement | null = null; // reduced-motion用の1枚

    function removeCard(card: HTMLDivElement) {
      const i = cards.indexOf(card);
      if (i !== -1) cards.splice(i, 1);
      card.remove();
    }

    function place(card: HTMLDivElement, x: number, y: number, scale: number) {
      // left/topではなくtranslateで配置(リフローさせない)
      card.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
    }

    function spawn(x: number, y: number) {
      const life = paramsRef.current.life;
      const card = document.createElement("div");
      // 画像はローテーションで選ぶ(ランダムだと同じ絵が連続する)
      card.className = `${styles.card} ${styles[`v${(variant++ % VARIANTS) + 1}`]}`;
      card.style.transitionDuration = `${life * 0.25}s`;
      place(card, x, y, 0.6);
      stage!.appendChild(card);
      cards.push(card);
      if (cards.length > MAX_CARDS) removeCard(cards[0]);

      // スタイルを確定させてから出現アニメーションを開始する
      void card.offsetWidth;
      card.style.opacity = "1";
      place(card, x, y, 1);

      // 寿命が来たらフェードアウト→必ずDOMから削除
      const t1 = window.setTimeout(() => {
        timers.delete(t1);
        card.style.opacity = "0";
        place(card, x, y, 0.85);
        const t2 = window.setTimeout(() => {
          timers.delete(t2);
          removeCard(card);
        }, life * 250);
        timers.add(t2);
      }, life * 1000);
      timers.add(t1);
    }

    function pointerMove(clientX: number, clientY: number) {
      const r = stage!.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;

      // reduced-motion時は軌跡を生成せず、静止した1枚が追従するだけ
      if (reduce) {
        if (!staticCard) {
          staticCard = document.createElement("div");
          staticCard.className = `${styles.card} ${styles.v1}`;
          staticCard.style.opacity = "1";
          stage!.appendChild(staticCard);
        }
        place(staticCard, x, y, 1);
        return;
      }

      // 距離ベースの間引き: spacing px以上動いたときだけ生成
      if (last && Math.hypot(x - last.x, y - last.y) < paramsRef.current.spacing) return;
      last = { x, y };
      spawn(x, y);
    }

    const onMouseMove = (e: MouseEvent) => pointerMove(e.clientX, e.clientY);
    const onLeave = () => {
      last = null;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      pointerMove(t.clientX, t.clientY);
    };

    stage.addEventListener("mousemove", onMouseMove);
    stage.addEventListener("mouseleave", onLeave);
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", onLeave);

    return () => {
      for (const t of timers) window.clearTimeout(t);
      for (const c of [...cards]) c.remove();
      staticCard?.remove();
      stage.removeEventListener("mousemove", onMouseMove);
      stage.removeEventListener("mouseleave", onLeave);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", onLeave);
    };
  }, []);

  return (
    <DemoStage stageRef={stageRef} hint="PC: ステージ内を動かす / スマホ: ドラッグ">
      <p className={styles.text}>MOVE AROUND</p>
    </DemoStage>
  );
}
