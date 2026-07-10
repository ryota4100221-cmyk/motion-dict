"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./OutlineFill.module.css";

const TEXT = "Outline";

// content/outline-fill.ts の direction options と同順(塗る前の隠し状態)
const HIDDEN_CLIPS = [
  "inset(0 100% 0 0)", // left: 左から開く
  "inset(100% 0 0 0)", // bottom: 下から満ちる
  "inset(0 50% 0 50%)", // center: 中央から開く
];

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

export default function OutlineFill({ params }: { params: ParamValues }) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();

  const hidden = HIDDEN_CLIPS[Math.round(params.direction)] ?? HIDDEN_CLIPS[0];

  // reduced-motion時はアニメーションなしで塗り状態を常時表示
  const fillStyle: CSSProperties = {
    clipPath: reduce || hovered ? "inset(0 0 0 0)" : hidden,
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  return (
    <DemoStage hint="PC: テキストにホバー / スマホ: タップ">
      <span
        className={styles.wrap}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered((h) => !h)}
      >
        <span className={styles.stroke}>{TEXT}</span>
        <span className={styles.fill} style={fillStyle} aria-hidden>
          {TEXT}
        </span>
      </span>
    </DemoStage>
  );
}
