"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./HoverWave.module.css";

const WORD = "Navigation";

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

export default function HoverWave({ params }: { params: ParamValues }) {
  // waveIdをkeyに含めてspanを作り直すことでアニメーションをリスタートする
  const [waveId, setWaveId] = useState(0);
  const reduce = useReducedMotion();

  const trigger = () => {
    if (!reduce) setWaveId((id) => id + 1);
  };

  return (
    <DemoStage hint="PC: テキストにホバー / スマホ: タップ">
      <span
        className={styles.link}
        onMouseEnter={trigger}
        onTouchStart={trigger}
      >
        {WORD.split("").map((ch, i) => {
          // i文字目の遅延 = i × delay。ここが波の伝播の正体
          const style: CSSProperties = {
            animationDelay: `${(i * params.delay).toFixed(3)}s`,
            animationDuration: `${params.duration}s`,
            ["--h" as string]: `${-params.height}px`,
          };
          return (
            <span
              key={`${waveId}-${i}`}
              className={waveId > 0 ? `${styles.char} ${styles.bouncing}` : styles.char}
              style={style}
            >
              {ch}
            </span>
          );
        })}
      </span>
    </DemoStage>
  );
}
