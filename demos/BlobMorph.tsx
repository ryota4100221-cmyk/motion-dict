"use client";

import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BlobMorph.module.css";

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

export default function BlobMorph({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();

  // 回転(spin)と変形(morph)は親子のレイヤーに分け、transformを衝突させない
  // reduced-motion時はanimation-nameを外し、静止した形のまま表示する
  const spinStyle: CSSProperties = {
    animationDuration: `${params.spin}s`,
    animationName: reduce ? "none" : undefined,
  };
  const blobStyle = {
    "--amp": `${params.amp}%`,
    animationDuration: `${params.duration}s`,
    animationName: reduce ? "none" : undefined,
  } as CSSProperties;

  return (
    <DemoStage hint="操作不要(自動でゆっくり変形し続ける)">
      <figure className={styles.card}>
        <div className={styles.scene}>
          <div className={styles.spin} style={spinStyle} aria-hidden>
            <div className={styles.blob} style={blobStyle} />
          </div>
        </div>
        <figcaption className={styles.caption}>
          Fig.05 — organic blob study
        </figcaption>
      </figure>
    </DemoStage>
  );
}
