"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./LiftHover.module.css";

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

export default function LiftHover({ params }: { params: ParamValues }) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();

  // reduced-motion時は浮き上がりを無効化し、状態変化は即時切り替え
  const lift = reduce ? 0 : params.lift;
  const duration = reduce ? 0 : params.duration;

  const cardStyle: CSSProperties = {
    transform: hovered ? `translateY(${-lift}px)` : "translateY(0)",
    transitionDuration: `${duration}s`,
  };
  // 影は事前描画したレイヤーのopacityだけを動かす(box-shadow自体のtransitionは重い)
  const shadowStyle: CSSProperties = {
    opacity: hovered ? 1 : 0,
    transitionDuration: `${duration}s`,
  };

  return (
    <DemoStage hint="PC: カードにホバー / スマホ: タップ">
      <div
        className={styles.card}
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered((h) => !h)}
      >
        <span className={styles.shadow} style={shadowStyle} aria-hidden />
        <span className={styles.title}>Lift</span>
        <span className={styles.rule} aria-hidden />
        <span className={styles.meta}>Hover to float</span>
      </div>
    </DemoStage>
  );
}
