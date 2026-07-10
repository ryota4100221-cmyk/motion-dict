"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./FrostedGlass.module.css";

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

export default function FrostedGlass({ params }: { params: ParamValues }) {
  const [shown, setShown] = useState(false);
  const reduce = useReducedMotion();

  const stageStyle = {
    "--fg-blur": `${params.blur}px`,
    "--fg-opacity": params.opacity,
  } as CSSProperties;

  // reduced-motion時はtransformを使わずopacityの遷移のみにする(centerのtranslateX(-50%)は常に維持)
  const panelStyle: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform:
      reduce || shown
        ? "translateX(-50%) translateY(0) scale(1)"
        : "translateX(-50%) translateY(16px) scale(0.96)",
    transitionDuration: reduce ? "0.2s" : `${params.duration}s`,
  };

  return (
    <DemoStage hint="PC: 画像にホバー / スマホ: タップ">
      <figure
        className={styles.frame}
        style={stageStyle}
        onMouseEnter={() => setShown(true)}
        onMouseLeave={() => setShown(false)}
        onTouchStart={() => setShown((s) => !s)}
      >
        <img
          src="/demo/dummy-03.svg"
          alt=""
          draggable={false}
          className={styles.img}
        />
        <div className={styles.panel} style={panelStyle}>
          <span className={styles.panelTitle}>Intentional</span>
          <span className={styles.panelSub}>frosted glass panel</span>
        </div>
      </figure>
    </DemoStage>
  );
}
