"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./ImageZoomHover.module.css";

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

export default function ImageZoomHover({ params }: { params: ParamValues }) {
  const [zoomed, setZoomed] = useState(false);
  const reduce = useReducedMotion();

  // reduced-motion時はズーム無効(常にscale 1のまま)
  const imgStyle: CSSProperties = {
    transform: !reduce && zoomed ? `scale(${params.scale})` : "scale(1)",
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  return (
    <DemoStage hint="PC: カードにホバー / スマホ: タップ">
      <figure
        className={styles.card}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onTouchStart={() => setZoomed((z) => !z)}
      >
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
          Fig.01 — gradient study
        </figcaption>
      </figure>
    </DemoStage>
  );
}
