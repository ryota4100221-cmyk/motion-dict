"use client";

import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SpinnerRing.module.css";

// 半径28pxの円周(2πr)。dashキーフレームはこの値(≈176)を基準にしている
const R = 28;
const C = 2 * Math.PI * R;

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

export default function SpinnerRing({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();

  // 弧の伸縮は回転よりゆっくり回すと、回転との位相差で表情が生まれる
  const svgStyle = {
    "--rotate-dur": `${params.speed}s`,
    "--dash-dur": `${params.speed * 1.5}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="操作不要(自動でループ再生)">
      <svg
        className={reduce ? styles.svgStatic : styles.svg}
        style={svgStyle}
        width="72"
        height="72"
        viewBox="0 0 72 72"
        role="img"
        aria-label="loading"
      >
        {/* 背面のトラック。リングの居場所と太さを常に示す */}
        <circle
          className={styles.track}
          cx="36"
          cy="36"
          r={R}
          strokeWidth={params.thickness}
        />
        {/* reduced-motion時はアニメーションなしで静的な3/4の弧を表示 */}
        <circle
          className={reduce ? styles.arcStatic : styles.arc}
          cx="36"
          cy="36"
          r={R}
          strokeWidth={params.thickness}
          strokeDasharray={reduce ? `${C * 0.75} ${C * 0.25}` : undefined}
        />
      </svg>
    </DemoStage>
  );
}
