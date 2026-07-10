"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FillHover.module.css";

// content/fill-hover.ts の direction options と同順(満ちる起点)
const DIRECTIONS = ["left", "bottom", "center"] as const;

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

export default function FillHover({ params }: { params: ParamValues }) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();

  const direction = DIRECTIONS[Math.round(params.direction)] ?? "left";
  // bottomのみ縦に満ちるのでscaleYを使う。実装の対応関係は content 側のpromptと同じ
  const scaleAxis = direction === "bottom" ? "scaleY" : "scaleX";
  const origin =
    direction === "left"
      ? "left center"
      : direction === "bottom"
        ? "center bottom"
        : "center center";

  // reduced-motion時はアニメーションなしで即座に色を切り替える
  const duration = reduce ? 0 : params.duration;

  const fillStyle: CSSProperties = {
    transformOrigin: origin,
    transform: hovered ? `${scaleAxis}(1)` : `${scaleAxis}(0)`,
    transitionDuration: `${duration}s`,
  };
  const labelStyle: CSSProperties = {
    color: hovered ? "var(--paper)" : undefined,
    transitionDuration: `${duration}s`,
  };

  return (
    <DemoStage hint="PC: ボタンにホバー / スマホ: タップ">
      <button
        className={styles.fillBtn}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered((h) => !h)}
      >
        <span className={styles.fill} style={fillStyle} aria-hidden />
        <span className={styles.label} style={labelStyle}>
          Hover me
        </span>
      </button>
    </DemoStage>
  );
}
