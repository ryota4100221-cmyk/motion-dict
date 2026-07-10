"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./TextSlideSwap.module.css";

// content/text-slide-swap.ts の direction options と同順(文字が抜けていく方向)
const DIRECTIONS = ["up", "down"] as const;

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

export default function TextSlideSwap({ params }: { params: ParamValues }) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();

  const dir = DIRECTIONS[Math.round(params.direction)] ?? "up";

  // 2段の列を1行ぶん(-50% = 自身の半分)動かすだけ。
  // up: 0 → -50%(上へ抜ける) / down: -50% → 0(下へ抜ける)
  const base = dir === "up" ? "translateY(0)" : "translateY(-50%)";
  const shifted = dir === "up" ? "translateY(-50%)" : "translateY(0)";

  // reduced-motion時はスライドさせず、色の変化のみ
  const rollStyle: CSSProperties = {
    transform: !reduce && hovered ? shifted : base,
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  // ホバーで見える側(入ってくる文字)をライムにして入れ替わりを可視化
  const incoming = dir === "up" ? 1 : 0;
  const itemStyle = (i: number): CSSProperties => ({
    color: (reduce ? hovered : i === incoming) ? "var(--ai)" : undefined,
  });

  return (
    <DemoStage hint="PC: ボタンにホバー / スマホ: タップ">
      <button
        className={styles.swapBtn}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered((h) => !h)}
      >
        <span className={styles.clip}>
          <span className={styles.roll} style={rollStyle}>
            <span className={styles.item} style={itemStyle(0)}>
              HOVER ME
            </span>
            <span className={styles.item} style={itemStyle(1)}>
              HOVER ME
            </span>
          </span>
        </span>
      </button>
    </DemoStage>
  );
}
