"use client";

import { useSyncExternalStore } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./DotsPulse.module.css";

const DOTS = [0, 1, 2];

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

export default function DotsPulse({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();

  return (
    <DemoStage hint="操作不要(自動でループ再生)">
      <div className={styles.bubble} role="img" aria-label="typing">
        {DOTS.map((i) => (
          <span
            key={i}
            className={reduce ? styles.dotStatic : styles.dot}
            style={
              // reduced-motion時はアニメーションなしで3点を静的に表示
              reduce
                ? undefined
                : {
                    animationDuration: `${params.speed}s`,
                    // 同じkeyframesを使い回し、delayだけずらして波にする
                    animationDelay: `${i * params.stagger}s`,
                  }
            }
          />
        ))}
      </div>
    </DemoStage>
  );
}
