"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ShadowPop.module.css";

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

// 影を積む方向の単位ベクトル(本体はこの真逆へ逃げる)
const DIRECTIONS = [
  { x: -1, y: 1 }, // bottom-left
  { x: 1, y: 1 }, // bottom-right
  { x: -1, y: -1 }, // top-left
  { x: 1, y: -1 }, // top-right
];

// 全段を1つのbox-shadowに事前描画する(transitionさせるのはopacityだけ)
function stackShadow(depth: number, steps: number, dx: number, dy: number) {
  return Array.from({ length: steps }, (_, i) => {
    const d = (depth * (i + 1)) / steps;
    return `${(dx * d).toFixed(2)}px ${(dy * d).toFixed(2)}px 0 var(--ai)`;
  }).join(", ");
}

export default function ShadowPop({ params }: { params: ParamValues }) {
  const [pressed, setPressed] = useState(false);
  const reduce = useReducedMotion();

  const dir = DIRECTIONS[Math.round(params.direction)] ?? DIRECTIONS[0];
  const steps = Math.max(1, Math.round(params.steps));
  // reduced-motion時は押し出しを止め、影の出し入れも即時切り替えにする
  const depth = reduce ? 0 : params.depth;
  const duration = reduce ? 0 : params.duration;

  const buttonStyle: CSSProperties = {
    transform: pressed
      ? `translate(${-dir.x * depth}px, ${-dir.y * depth}px)`
      : "translate(0, 0)",
    transitionDuration: `${duration}s`,
  };
  const slabStyle: CSSProperties = {
    boxShadow: stackShadow(params.depth, steps, dir.x, dir.y),
    opacity: pressed ? 1 : 0,
    transitionDuration: `${duration}s`,
  };

  return (
    <DemoStage hint="PC: ボタンにホバー / スマホ: タップ">
      <button
        type="button"
        className={styles.button}
        style={buttonStyle}
        onMouseEnter={() => setPressed(true)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed((p) => !p)}
      >
        <span className={styles.slab} style={slabStyle} aria-hidden />
        <span className={styles.label}>View work</span>
      </button>
    </DemoStage>
  );
}
