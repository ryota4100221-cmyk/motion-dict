"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FlipCard.module.css";

// content/flip-card.ts の direction options と同順(rotateYの角度)
const ANGLES = [180, -180] as const;

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

export default function FlipCard({ params }: { params: ParamValues }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();

  const angle = ANGLES[Math.round(params.direction)] ?? 180;

  const sceneStyle: CSSProperties = {
    perspective: `${params.perspective}px`,
  };

  // reduced-motion時は回転させず、表裏をopacityで即時切り替える
  const innerStyle: CSSProperties = reduce
    ? {}
    : {
        transform: flipped ? `rotateY(${angle}deg)` : "rotateY(0deg)",
        transitionDuration: `${params.duration}s`,
      };

  const frontStyle: CSSProperties = reduce ? { opacity: flipped ? 0 : 1 } : {};
  const backStyle: CSSProperties = reduce
    ? { opacity: flipped ? 1 : 0, transform: "none" }
    : {};

  return (
    <DemoStage hint="PC: カードにホバー / スマホ: タップ">
      <div className={styles.scene} style={sceneStyle}>
        <div
          className={styles.inner}
          style={innerStyle}
          onMouseEnter={() => setFlipped(true)}
          onMouseLeave={() => setFlipped(false)}
          onTouchStart={() => setFlipped((f) => !f)}
        >
          <div className={`${styles.face} ${styles.front}`} style={frontStyle}>
            <img
              src="/demo/dummy-02.svg"
              alt=""
              draggable={false}
              className={styles.img}
            />
            <span className={styles.frontLabel}>Front</span>
          </div>
          <div className={`${styles.face} ${styles.back}`} style={backStyle}>
            <p className={styles.backTitle}>Back</p>
            <p className={styles.backText}>
              perspective {Math.round(params.perspective)}px
              <br />
              rotateY({angle > 0 ? `+${angle}` : angle}deg)
            </p>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
