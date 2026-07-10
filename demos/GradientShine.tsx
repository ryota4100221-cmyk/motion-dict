"use client";

import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./GradientShine.module.css";

const TEXT = "SHINE";

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

export default function GradientShine({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();

  // ベース色の中央に幅band%のハイライト帯を置いたグラデーション
  const band = params.band;
  const style: CSSProperties = reduce
    ? // reduced-motion時はアニメーションを止め、静的な文字として表示
      { backgroundImage: "none", animation: "none", color: "var(--code-fg)" }
    : {
        backgroundImage: `linear-gradient(110deg, var(--sumi-soft) ${
          50 - band / 2
        }%, var(--ai) 50%, var(--sumi-soft) ${50 + band / 2}%)`,
        animationDuration: `${params.period}s`,
      };

  return (
    <DemoStage hint="自動でループ再生">
      <span className={styles.shine} style={style}>
        {TEXT}
      </span>
    </DemoStage>
  );
}
