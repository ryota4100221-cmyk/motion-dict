"use client";

import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./SkeletonShimmer.module.css";

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

export default function SkeletonShimmer({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();

  // 光の帯: background-size 200% の画像内で、ブロック幅の {width}% に
  // 見える幅のグラデーション(画像幅換算では width/2 %、半幅は width/4 %)
  const half = params.width / 4;

  // reduced-motion時はシマーなしの静止スケルトンのみ表示
  const bone: CSSProperties = reduce
    ? {}
    : {
        backgroundImage: `linear-gradient(105deg, transparent ${
          50 - half
        }%, rgba(165, 224, 46, 0.22) 50%, transparent ${50 + half}%)`,
        animationDuration: `${params.speed}s`,
      };
  const boneClass = reduce
    ? styles.bone
    : `${styles.bone} ${styles.shimmer}`;

  return (
    <DemoStage hint="PC/スマホ: 自動ループ再生(操作不要)">
      <div className={styles.card}>
        <div className={styles.row}>
          <span className={`${boneClass} ${styles.avatar}`} style={bone} />
          <span className={styles.lines}>
            <span className={`${boneClass} ${styles.lineWide}`} style={bone} />
            <span
              className={`${boneClass} ${styles.lineNarrow}`}
              style={bone}
            />
          </span>
        </div>
        <span className={`${boneClass} ${styles.thumb}`} style={bone} />
        <span className={`${boneClass} ${styles.lineFull}`} style={bone} />
        <span className={`${boneClass} ${styles.lineHalf}`} style={bone} />
      </div>
    </DemoStage>
  );
}
