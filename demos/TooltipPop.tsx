"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./TooltipPop.module.css";

const EASE_POP = "cubic-bezier(0.22, 1, 0.36, 1)"; // 入り: 減速のポップ
const HIDE_DURATION = 0.12; // 出は遅延なし・短く(固定)

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

export default function TooltipPop({ params }: { params: ParamValues }) {
  const [shown, setShown] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const reduce = useReducedMotion();

  const delay = params.delay;
  const duration = params.duration;

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  // hover intent: delay秒待ってから表示。離れたら即キャンセル&即非表示
  const enter = () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setShown(true), delay * 1000);
  };
  const leave = () => {
    window.clearTimeout(timerRef.current);
    setShown(false);
  };

  // reduced-motion: transformを使わずopacityフェードのみ
  const tipStyle: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform:
      reduce || shown
        ? "translate(-50%, 0) scale(1)"
        : "translate(-50%, 4px) scale(0.96)",
    transition: reduce
      ? "opacity 0.15s linear"
      : shown
        ? `opacity ${duration}s ease-out, transform ${duration}s ${EASE_POP}`
        : `opacity ${HIDE_DURATION}s ease-out, transform ${HIDE_DURATION}s ease-out`,
  };

  return (
    <DemoStage hint="PC: ラベルにホバー(出現は遅延) / スマホ: タップで開閉">
      <span
        className={styles.target}
        onMouseEnter={enter}
        onMouseLeave={leave}
        onTouchStart={() => setShown((s) => !s)}
      >
        HOVER INTENT
        <span
          className={styles.tooltip}
          style={tipStyle}
          role="tooltip"
          aria-hidden={!shown}
        >
          {delay.toFixed(2)}s 待ってから出る補足
        </span>
      </span>
    </DemoStage>
  );
}
