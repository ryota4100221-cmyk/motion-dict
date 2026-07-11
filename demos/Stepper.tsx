"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Stepper.module.css";

// content/stepper.ts の easing options と同順(CSSのtiming-function値)
const EASINGS = [
  "cubic-bezier(0.22, 1, 0.36, 1)", // ease-out
  "ease-in-out",
  "cubic-bezier(0.34, 1.56, 0.64, 1)", // back(行き過ぎて戻る)
] as const;

const STEPS = ["情報入力", "確認", "支払い", "完了"];

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

export default function Stepper({ params }: { params: ParamValues }) {
  const [current, setCurrent] = useState(1);
  const reduce = useReducedMotion();

  const easing = EASINGS[Math.round(params.easing)] ?? EASINGS[0];
  const dur = reduce ? "0s" : `${params.duration}s`;

  // 連結線は通過済み(index < current)だけ scaleX(1)。伸びる起点は左。
  const fillStyle = (i: number): CSSProperties => ({
    transform: i < current ? "scaleX(1)" : "scaleX(0)",
    transitionDuration: dur,
    transitionTimingFunction: easing,
  });

  // ノードの拡大はノード自身のtransformに分離。現在ノードだけ nodeScale。
  const nodeStyle = (i: number): CSSProperties => ({
    transform: reduce ? "scale(1)" : `scale(${i === current ? params.nodeScale : 1})`,
    transitionDuration: dur,
    transitionTimingFunction: easing,
  });

  return (
    <DemoStage hint="PC/スマホ: 進む・戻るボタン、またはステップの丸をクリック">
      <div className={styles.wrap}>
        <div className={styles.track}>
          {STEPS.map((label, i) => (
            <div className={styles.col} key={label}>
              {/* 連結線(前のノードとの間)。先頭ノードには線を置かない */}
              {i > 0 && (
                <span className={styles.line} aria-hidden>
                  <span className={styles.fill} style={fillStyle(i)} />
                </span>
              )}
              <button
                type="button"
                className={
                  i < current
                    ? `${styles.node} ${styles.done}`
                    : i === current
                    ? `${styles.node} ${styles.active}`
                    : styles.node
                }
                style={nodeStyle(i)}
                onClick={() => setCurrent(i)}
                aria-current={i === current ? "step" : undefined}
              >
                {i < current ? "✓" : i + 1}
              </button>
              <span className={styles.label}>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.ctrl}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            戻る
          </button>
          <button
            type="button"
            className={styles.ctrl}
            onClick={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
            disabled={current === STEPS.length - 1}
          >
            進む
          </button>
        </div>
      </div>
    </DemoStage>
  );
}
