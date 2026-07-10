"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./DuotoneHover.module.css";

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

export default function DuotoneHover({ params }: { params: ParamValues }) {
  const [active, setActive] = useState(false);
  const reduce = useReducedMotion();

  // reduced-motion時はtransitionを0sにして即時切り替え(色の状態変化は残す)
  const cardStyle = {
    "--dt-strength": params.strength,
    "--dt-duration": reduce ? "0s" : `${params.duration}s`,
  } as CSSProperties;

  return (
    <DemoStage hint="PC: カードにホバー / スマホ: タップ">
      <figure
        className={active ? `${styles.card} ${styles.cardActive}` : styles.card}
        style={cardStyle}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onTouchStart={() => setActive((a) => !a)}
      >
        <div className={styles.frame}>
          <div className={styles.img} />
          <div className={styles.overlay} />
        </div>
        <figcaption className={styles.caption}>
          Fig.03 — duotone study
        </figcaption>
      </figure>
    </DemoStage>
  );
}
