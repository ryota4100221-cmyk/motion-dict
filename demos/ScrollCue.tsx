"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ScrollCue.module.css";

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

// 消えてから現れ終わるまでの区間(1周に対する割合)。実測(Salient系)は 46%→65% で約0.2
const APPEAR = 0.2;

export default function ScrollCue({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const bodyRef = useRef<HTMLSpanElement>(null);
  const wheelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    const wheel = wheelRef.current;
    if (!body || !wheel || reduce) return;

    // 区間の割合をスライダーで変えたいので、@keyframes の%ではなく offset で組む
    const p = params.share / 100;
    const shown = Math.min(p + APPEAR, 1);
    const duration = params.duration * 1000;

    const wheelAnim = wheel.animate(
      [
        {
          offset: 0,
          opacity: 1,
          transform: "translateY(0) scaleY(1)",
          easing: "cubic-bezier(0.25, 0.6, 0.4, 1)",
        },
        {
          offset: p,
          opacity: 0,
          transform: `translateY(${params.travel}px) scaleY(0.5)`,
        },
        // 消えた直後に上へ瞬間的に戻す。戻りを見せると往復の揺れになる
        { offset: p + 0.01, opacity: 0, transform: "translateY(0) scaleY(1)" },
        { offset: shown, opacity: 1, transform: "translateY(0) scaleY(1)" },
        { offset: 1, opacity: 1, transform: "translateY(0) scaleY(1)" },
      ],
      { duration, iterations: Infinity }
    );

    const bodyAnim = body.animate(
      [
        { offset: 0, transform: "translateY(0)", easing: "ease-in-out" },
        { offset: p, transform: `translateY(${params.nudge}px)`, easing: "ease-in-out" },
        { offset: shown, transform: "translateY(0)" },
        { offset: 1, transform: "translateY(0)" },
      ],
      { duration, iterations: Infinity }
    );

    return () => {
      wheelAnim.cancel();
      bodyAnim.cancel();
    };
  }, [params.travel, params.duration, params.share, params.nudge, reduce]);

  return (
    <DemoStage hint="自動で再生: スライダーで距離・周期・区間の割合を変えられる">
      <div className={styles.hero} aria-hidden>
        <span className={styles.eyebrow}>MOTION DICTIONARY</span>
        <span className={styles.title}>First view</span>
      </div>
      <div className={styles.fold} aria-hidden />
      {/* 実運用では次のセクションへ送る <button>。録画が押さないよう飾りの span にしている */}
      <span className={styles.cue} aria-hidden>
        <span className={styles.mouse} ref={bodyRef}>
          <span className={styles.wheel} ref={wheelRef} />
        </span>
        <span className={styles.label}>SCROLL</span>
      </span>
    </DemoStage>
  );
}
