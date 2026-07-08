"use client";

import { useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./UnderlineReveal.module.css";

// content/underline-reveal.ts の origin options と同順(CSSのtransform-origin値)
const ORIGINS = ["left", "center", "right"] as const;

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

export default function UnderlineReveal({ params }: { params: ParamValues }) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();

  const origin = ORIGINS[Math.round(params.origin)] ?? "left";
  const markerLeft = origin === "left" ? "0%" : origin === "center" ? "50%" : "100%";

  // reduced-motion時はアニメーションなしで下線を常時表示
  const lineStyle: CSSProperties = {
    transformOrigin: origin,
    transform: reduce || hovered ? "scaleX(1)" : "scaleX(0)",
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  return (
    <DemoStage hint="PC: テキストにホバー / スマホ: タップ">
      <span
        className={styles.link}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered((h) => !h)}
      >
        UNDERLINE
        <span className={styles.line} style={lineStyle} />
        <span
          className={styles.originMarker}
          style={{ left: markerLeft }}
          aria-hidden
        />
      </span>
    </DemoStage>
  );
}
