"use client";

import { useId, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./RotatingBadge.module.css";

// 円形パスの半径と円周(textLengthに指定して文字を等間隔に分配する)
const RADIUS = 36;
const CIRCUMFERENCE = Math.round(2 * Math.PI * RADIUS); // ≒ 226

// content/rotating-badge.ts の direction options と同順(CSSのanimation-direction値)
const DIRECTIONS = ["normal", "reverse"] as const;

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

export default function RotatingBadge({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const pathId = useId();

  // reduced-motion時は回転を止め、円形テキストを静止表示
  const ringStyle: CSSProperties = {
    animationDuration: `${params.duration}s`,
    animationDirection: DIRECTIONS[Math.round(params.direction)] ?? "normal",
    animationPlayState: reduce ? "paused" : "running",
  };

  return (
    <DemoStage hint="自動でループ再生">
      <svg className={styles.badge} viewBox="0 0 100 100" aria-hidden>
        <defs>
          {/* 半径36の円形パス。textPathはこれに沿って組まれる */}
          <path
            id={pathId}
            d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
          />
        </defs>
        {/* 回るのはテキストのリングだけ。中央の矢印は静止させる */}
        <g className={styles.ring} style={ringStyle}>
          <text className={styles.ringText}>
            <textPath
              href={`#${pathId}`}
              textLength={CIRCUMFERENCE}
              lengthAdjust="spacing"
            >
              Scroll down · Scroll down · Scroll down ·{" "}
            </textPath>
          </text>
        </g>
        <text className={styles.arrow} x="50" y="52">
          ↓
        </text>
      </svg>
    </DemoStage>
  );
}
