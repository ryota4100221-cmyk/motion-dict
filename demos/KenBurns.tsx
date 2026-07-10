"use client";

import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./KenBurns.module.css";

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

export default function KenBurns({ params }: { params: ParamValues }) {
  const reduce = useReducedMotion();

  // reduced-motion時はanimation-nameを外し、静止画のまま表示する
  const imgStyle = {
    "--kb-zoom": params.zoom,
    "--kb-pan": `${params.pan}%`,
    animationName: reduce ? "none" : undefined,
    animationDuration: `${params.duration}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="操作不要(自動でズーム+パンをループ再生)">
      <figure className={styles.card}>
        <div className={styles.frame}>
          <img
            src="/demo/dummy-01.svg"
            alt=""
            draggable={false}
            className={styles.img}
            style={imgStyle}
          />
        </div>
        <figcaption className={styles.caption}>
          Fig.02 — slow zoom study
        </figcaption>
      </figure>
    </DemoStage>
  );
}
