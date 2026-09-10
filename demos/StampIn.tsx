"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import { addTick } from "@/lib/raf";
import type { ParamValues } from "@/lib/types";
import styles from "./StampIn.module.css";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCE_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false
  );
}

const IDLE_WAIT = 2000; // この時間さわられなければ自走に戻る
const IDLE_STEP = 2600; // 自走時に押し直す間隔

// 押し込んで反発する感触。終端でわずかに行き過ぎる制御点(1.3)が肝
const PRESS_EASE = "cubic-bezier(0.34, 1.3, 0.5, 1)";

export default function StampIn({ params }: { params: ParamValues }) {
  const sealRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const touchedRef = useRef(false);
  const lastInputRef = useRef(0);
  const lastStepRef = useRef(-1);
  const reduce = useReducedMotion();

  const { scale, angle, rest, duration } = params;

  const play = useCallback(() => {
    const el = sealRef.current;
    if (!el) return;
    animRef.current?.cancel();
    // reduced-motion: 拡大も回転もせず、着地角度に固定したままフェードインだけで出す
    if (reduce) {
      animRef.current = el.animate(
        [
          { opacity: 0, transform: `rotate(${rest}deg)` },
          { opacity: 1, transform: `rotate(${rest}deg)` },
        ],
        { duration: 200, fill: "both" }
      );
      return;
    }
    animRef.current = el.animate(
      [
        { opacity: 0, transform: `scale(${scale}) rotate(${-angle}deg)` },
        { opacity: 1, transform: `scale(1) rotate(${rest}deg)` },
      ],
      // fill: "both" が無いと押し終わった瞬間に初期状態へ戻り、判子が消える
      { duration: duration * 1000, easing: PRESS_EASE, fill: "both" }
    );
  }, [scale, angle, rest, duration, reduce]);

  // マウント時と、スライダーを動かすたびに押し直す(数値の効きがその場で分かる)
  useEffect(() => {
    play();
  }, [play]);

  // 無操作のあいだは一定間隔で自走させる(録画が静止画にならないように)
  useEffect(() => {
    if (reduce) return;
    return addTick((time) => {
      if (touchedRef.current) {
        touchedRef.current = false;
        lastInputRef.current = time;
      }
      if (time - lastInputRef.current < IDLE_WAIT) return;
      const step = Math.floor(time / IDLE_STEP);
      if (step === lastStepRef.current) return;
      lastStepRef.current = step;
      play();
    });
  }, [play, reduce]);

  const touch = () => {
    touchedRef.current = true;
    play();
  };

  return (
    <DemoStage hint="PC: 書類をクリックで押し直す / スマホ: タップ(スライダー操作でも再生)">
      <div
        className={styles.doc}
        onClick={touch}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            touch();
          }
        }}
      >
        {/* 台紙。押される側は動かさない(動かすと画面全体が揺れて衝撃の主体がぼける) */}
        <div className={styles.docHead}>INVOICE — 0912</div>
        <div className={styles.docLines}>
          <span className={styles.line} />
          <span className={`${styles.line} ${styles.short}`} />
          <span className={styles.line} />
          <span className={`${styles.line} ${styles.short}`} />
        </div>
        {/* 判子。transform-origin は中心のまま(端を軸にすると弧を描く別の動きになる) */}
        <div ref={sealRef} className={styles.seal}>
          <span className={styles.sealTop}>APPROVED</span>
          <span className={styles.sealBar} />
          <span className={styles.sealDate}>09 · 11</span>
        </div>
      </div>
    </DemoStage>
  );
}
