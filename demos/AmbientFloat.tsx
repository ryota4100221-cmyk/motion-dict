"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./AmbientFloat.module.css";

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

// 配置と個体差。offsetは周期のずらし係数(-1〜1)、phaseは開始位相(0〜1)。
// 乱数ではなく固定値で持つ。毎回同じ絵になったほうが辞典として比較しやすい
const ITEMS = [
  { x: 14, y: 22, w: 74, h: 92, offset: -0.8, phase: 0.0, tone: 1 },
  { x: 34, y: 56, w: 58, h: 58, offset: 0.5, phase: 0.35, tone: 0 },
  { x: 50, y: 16, w: 96, h: 64, offset: -0.2, phase: 0.7, tone: 0 },
  { x: 69, y: 52, w: 66, h: 84, offset: 0.9, phase: 0.15, tone: 1 },
  { x: 86, y: 26, w: 46, h: 46, offset: -0.5, phase: 0.55, tone: 0 },
  { x: 24, y: 78, w: 40, h: 40, offset: 0.3, phase: 0.85, tone: 0 },
];

export default function AmbientFloat({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);

  const active = !reduce && !paused;

  return (
    <DemoStage
      hint="クリック / タップ: 一時停止(周期のズレが見える)"
      className={styles.floatStage}
    >
      <button
        type="button"
        className={styles.field}
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "浮遊を再開" : "浮遊を一時停止"}
      >
        {ITEMS.map((item, i) => {
          // 周期を要素ごとに ±spread% ずらす。ここが揃うと機械的な同期になる
          const duration = params.duration * (1 + (params.spread / 100) * item.offset);
          const style = {
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.w}px`,
            height: `${item.h}px`,
            "--float-distance": `${params.distance}px`,
            "--float-rotate": `${params.rotate * (i % 2 === 0 ? 1 : -1)}deg`,
            animationDuration: `${duration}s`,
            // 負のdelayで再生済みの状態から開始する。初回表示から位相がばらける
            animationDelay: `${-duration * item.phase}s`,
          } as CSSProperties;

          return (
            <span
              key={i}
              className={[
                styles.item,
                item.tone === 1 ? styles.itemAccent : "",
                active ? styles.itemOn : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={style}
              aria-hidden
            />
          );
        })}
      </button>
    </DemoStage>
  );
}
