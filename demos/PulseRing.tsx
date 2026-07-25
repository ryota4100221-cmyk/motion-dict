"use client";

import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./PulseRing.module.css";

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

export default function PulseRing({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();
  const count = Math.round(params.count);
  const rings = Array.from({ length: count }, (_, i) => i);

  return (
    <DemoStage hint="操作不要(自動でループ再生)／本数・周期・広がりをスライダーで">
      <div className={styles.beacon}>
        <div className={styles.dot}>
          {/* reduced-motion時はリングを出さず、コアの点だけを見せる */}
          {!reduce &&
            rings.map((i) => (
              <span
                key={i}
                className={styles.ring}
                aria-hidden
                style={
                  {
                    animationDuration: `${params.duration}s`,
                    // 周期を本数で割った間隔で放つと、輪が等間隔で広がり続ける
                    animationDelay: `${(i * params.duration) / count}s`,
                    "--spread": params.spread,
                  } as CSSProperties
                }
              />
            ))}
          <span className={styles.core} />
        </div>
        <span className={styles.label}>LIVE</span>
      </div>
    </DemoStage>
  );
}
